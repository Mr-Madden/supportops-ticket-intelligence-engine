"""
Webhook router — POST /webhook/ticket
"""

import hashlib
import hmac
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.schemas import WebhookAck
from app.services.ticket_analyzer import TicketAnalyzer

router = APIRouter()
logger = logging.getLogger(__name__)
_analyzer = TicketAnalyzer()


def _verify_signature(body: bytes, signature: str | None) -> bool:
    if not settings.ZENDESK_WEBHOOK_SECRET:
        return True
    if not signature:
        return False
    expected = hmac.new(
        settings.ZENDESK_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature.removeprefix("sha256="))


@router.post("/ticket", response_model=WebhookAck, status_code=status.HTTP_200_OK)
async def ticket_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    x_zendesk_webhook_signature: str | None = Header(None),
):
    raw_body = await request.body()

    if not _verify_signature(raw_body, x_zendesk_webhook_signature):
        logger.warning("webhook_signature_invalid")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid webhook signature")

    payload = await request.json()
    ticket  = payload.get("ticket", {})
    ticket_id = ticket.get("id")

    if not ticket_id:
        return WebhookAck(status="skipped", ticket_id=0, message="No ticket ID in payload")

    logger.info("webhook_received", extra={"ticket_id": ticket_id})

    background_tasks.add_task(
        _analyzer.analyze,
        ticket_id  = ticket_id,
        subject    = ticket.get("subject", ""),
        body       = ticket.get("description", ""),
        db         = db,
        metadata   = {"customer_tier": ticket.get("priority", "normal")},
        event_type = "webhook",
    )

    return WebhookAck(status="queued", ticket_id=ticket_id, message="Analysis queued")
