"""
Analysis API router

Endpoints:
  POST  /api/v1/analyze
  GET   /api/v1/tickets
  GET   /api/v1/tickets/{ticket_id}
  POST  /api/v1/tickets/bulk
  PATCH /api/v1/tickets/{ticket_id}/feedback
"""

import asyncio
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import TicketAnalysis
from app.db.session import get_db
from app.models.schemas import (
    AnalysisList, AnalysisResult, AnalyzeRequest,
    BulkAnalyzeRequest, FeedbackRequest,
)
from app.services.ticket_analyzer import TicketAnalyzer

router = APIRouter()
logger = logging.getLogger(__name__)
_analyzer = TicketAnalyzer()


@router.post("/analyze", response_model=AnalysisResult, status_code=status.HTTP_200_OK)
async def analyze_ticket(body: AnalyzeRequest, db: AsyncSession = Depends(get_db)):
    return await _analyzer.analyze(
        ticket_id  = body.ticket_id,
        subject    = body.subject,
        body       = body.body,
        db         = db,
        metadata   = {"customer_tier": body.customer_tier, "ticket_count": body.ticket_count},
        event_type = "manual",
    )


@router.get("/tickets", response_model=AnalysisList)
async def list_analyses(
    page: int     = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: str | None = Query(None),
    priority: str | None = Query(None),
    flagged: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(TicketAnalysis).order_by(TicketAnalysis.created_at.desc())
    if category:
        query = query.where(TicketAnalysis.category == category)
    if priority:
        query = query.where(TicketAnalysis.priority == priority)
    if flagged is not None:
        query = query.where(TicketAnalysis.flagged_for_review == flagged)

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    items = (await db.scalars(query.offset((page - 1) * per_page).limit(per_page))).all()

    return AnalysisList(
        total=total or 0, page=page, per_page=per_page,
        pages=max(1, (total or 0 + per_page - 1) // per_page),
        items=items,
    )


@router.get("/tickets/{ticket_id}", response_model=AnalysisResult)
async def get_analysis(ticket_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.scalar(
        select(TicketAnalysis)
        .where(TicketAnalysis.zendesk_ticket_id == ticket_id)
        .order_by(TicketAnalysis.created_at.desc())
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"No analysis found for ticket {ticket_id}")
    return result


@router.post("/tickets/bulk", status_code=status.HTTP_202_ACCEPTED)
async def bulk_analyze(
    body: BulkAnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    from app.shared.zendesk import ZendeskClient
    zd = ZendeskClient()

    async def _run_bulk():
        semaphore = asyncio.Semaphore(5)

        async def _process_one(tid: int):
            async with semaphore:
                try:
                    ticket = await zd.tickets.get(tid)
                    await _analyzer.analyze(
                        ticket_id=tid, subject=ticket.get("subject", ""),
                        body=ticket.get("description", ""), db=db, event_type="bulk",
                    )
                except Exception as exc:
                    logger.error("bulk_ticket_error", extra={"ticket_id": tid, "error": str(exc)})

        await asyncio.gather(*[_process_one(tid) for tid in body.ticket_ids])

    background_tasks.add_task(_run_bulk)
    return {"status": "queued", "count": len(body.ticket_ids)}


@router.patch("/tickets/{ticket_id}/feedback", status_code=status.HTTP_200_OK)
async def submit_feedback(
    ticket_id: int, body: FeedbackRequest, db: AsyncSession = Depends(get_db)
):
    analysis = await db.scalar(
        select(TicketAnalysis).where(TicketAnalysis.zendesk_ticket_id == ticket_id)
    )
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"No analysis for ticket {ticket_id}")
    if body.correct_category:    analysis.category      = body.correct_category
    if body.correct_priority:    analysis.priority      = body.correct_priority
    if body.correct_routing_group: analysis.routing_group = body.correct_routing_group
    await db.flush()
    return {"status": "updated", "ticket_id": ticket_id}
