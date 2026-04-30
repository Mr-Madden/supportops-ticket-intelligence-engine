"""
Ticket Analyser — orchestrates the full LLM analysis pipeline.

Pipeline per ticket (all LLM calls run concurrently):
  1. scrubPII()        — sanitise text
  2. runLLM(tagger)    — extract tags + category
  3. runLLM(sentiment) — score sentiment 1-5
  4. runLLM(priority)  — predict priority + confidence
  5. runLLM(summary)   — generate agent-ready summary
  6. runLLM(router)    — recommend queue/group

Then writes to DB and pushes results back to Zendesk.
"""

import asyncio
import hashlib
import logging
import time
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.db.models import TicketAnalysis, ProcessingLog
from app.shared.llm import runLLM
from app.shared.pii import scrubPII
from app.shared.zendesk import ZendeskClient

logger = logging.getLogger(__name__)

_DEFAULT_GROUPS = [
    "General Support",
    "Billing Team",
    "Technical Support",
    "Developer Support",
    "Enterprise Support",
    "Account Management",
]


class TicketAnalyzer:

    def __init__(self, zendesk: ZendeskClient | None = None):
        self.zendesk = zendesk or ZendeskClient()

    async def analyze(
        self,
        ticket_id: int,
        subject: str,
        body: str,
        db: AsyncSession,
        metadata: dict[str, Any] | None = None,
        event_type: str = "webhook",
    ) -> TicketAnalysis:
        start_ms = time.time()
        meta = metadata or {}
        log_status = "success"
        log_error: str | None = None

        try:
            # 1. Deduplication check
            if settings.ENABLE_DEDUP:
                existing = await db.scalar(
                    select(TicketAnalysis).where(TicketAnalysis.zendesk_ticket_id == ticket_id)
                )
                if existing:
                    logger.info("ticket_already_analysed", extra={"ticket_id": ticket_id})
                    return existing

            # 2. Scrub PII
            clean_subject = scrubPII(subject)
            clean_body    = scrubPII(body)
            body_hash     = hashlib.sha256(clean_body.encode()).hexdigest()

            # 3. Fetch available groups for routing context
            try:
                groups_data = await self.zendesk.groups.list()
                available_groups = [g["name"] for g in groups_data] or _DEFAULT_GROUPS
            except Exception:
                available_groups = _DEFAULT_GROUPS

            # 4. Run 4 LLM tasks concurrently, then router last (needs category)
            tags_result, sentiment_result, priority_result, summary_result = await asyncio.gather(
                runLLM("tagger",    subject=clean_subject, body=clean_body),
                runLLM("sentiment", body=clean_body),
                runLLM("priority",  subject=clean_subject, body=clean_body,
                       customer_tier=meta.get("customer_tier", "normal"),
                       ticket_count=meta.get("ticket_count", 0)),
                runLLM("summary",   subject=clean_subject, body=clean_body),
            )

            router_result = await runLLM(
                "router",
                body=clean_body,
                category=tags_result.get("category", "general"),
                tags=", ".join(tags_result.get("tags", [])),
                priority=priority_result.get("priority", "normal"),
                available_groups=", ".join(available_groups),
            )

            # 5. Persist
            elapsed_ms = int((time.time() - start_ms) * 1000)
            analysis = TicketAnalysis(
                zendesk_ticket_id   = ticket_id,
                subject             = clean_subject[:500] if clean_subject else None,
                body_hash           = body_hash,
                tags                = tags_result.get("tags"),
                category            = tags_result.get("category"),
                sub_category        = tags_result.get("sub_category"),
                sentiment_score     = sentiment_result.get("score"),
                sentiment_label     = sentiment_result.get("label"),
                escalation_risk     = sentiment_result.get("escalation_risk"),
                priority            = priority_result.get("priority"),
                priority_confidence = priority_result.get("confidence"),
                priority_reason     = priority_result.get("reason"),
                summary             = summary_result.get("summary"),
                key_issue           = summary_result.get("key_issue"),
                customer_ask        = summary_result.get("customer_ask"),
                routing_group       = router_result.get("recommended_group"),
                routing_reason      = router_result.get("reason"),
                routing_confidence  = router_result.get("confidence"),
                routing_fallback    = router_result.get("fallback_group"),
                model_version       = settings.ANTHROPIC_MODEL,
                processing_ms       = elapsed_ms,
                flagged_for_review  = (sentiment_result.get("escalation_risk") == "high"),
            )

            db.add(analysis)
            await db.flush()

            # 6. Push to Zendesk (non-fatal on failure)
            try:
                await self._push_to_zendesk(ticket_id, analysis)
            except Exception as exc:
                logger.warning("zendesk_push_failed",
                               extra={"ticket_id": ticket_id, "error": str(exc)})

            logger.info("ticket_analysed",
                        extra={"ticket_id": ticket_id, "category": analysis.category,
                               "priority": analysis.priority, "elapsed_ms": elapsed_ms})
            return analysis

        except Exception as exc:
            log_status = "error"
            log_error = str(exc)[:500]
            logger.error("ticket_analysis_failed",
                         extra={"ticket_id": ticket_id, "error": log_error})
            raise

        finally:
            duration_ms = int((time.time() - start_ms) * 1000)
            db.add(ProcessingLog(
                zendesk_ticket_id = ticket_id,
                event_type        = event_type,
                status            = log_status,
                error_message     = log_error,
                duration_ms       = duration_ms,
            ))

    async def _push_to_zendesk(self, ticket_id: int, analysis: TicketAnalysis) -> None:
        fields: dict[str, Any] = {}

        if settings.PUSH_TAGS_TO_ZENDESK and analysis.tags:
            fields["tags"] = analysis.tags

        if settings.PUSH_PRIORITY_TO_ZENDESK and analysis.priority:
            fields["priority"] = analysis.priority

        if settings.PUSH_INTERNAL_NOTE and analysis.summary:
            lines = [
                f"**AI Summary:** {analysis.summary}",
                "",
                f"**Category:** {analysis.category or 'unknown'}",
                f"**Sentiment:** {analysis.sentiment_score}/5 — {analysis.sentiment_label or ''}",
            ]
            if analysis.routing_group:
                lines.append(f"**Suggested queue:** {analysis.routing_group} — {analysis.routing_reason or ''}")
            if analysis.escalation_risk == "high":
                lines.append("⚠️ **Escalation risk: HIGH** — review immediately")
            fields["comment"] = {"body": "\n".join(lines), "public": False}

        if fields:
            await self.zendesk.tickets.update(ticket_id, fields)
