"""
Metrics router — queue health and aggregates.
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import TicketAnalysis
from app.db.session import get_db
from app.models.schemas import QueueMetrics
from app.shared.cache import get_cache, set_cache
from app.shared.zendesk import ZendeskClient

router = APIRouter()
_zd = ZendeskClient()


@router.get("/metrics/queue", response_model=QueueMetrics)
async def queue_health(db: AsyncSession = Depends(get_db)):
    cached = await get_cache("metrics:queue")
    if cached:
        return QueueMetrics(**cached)

    try:
        open_count    = len(await _zd.tickets.list(status=["open"]))
        pending_count = len(await _zd.tickets.list(status=["pending"]))
        new_count     = len(await _zd.tickets.list(status=["new"]))
    except Exception:
        open_count = pending_count = new_count = 0

    today = datetime.utcnow().date()
    rows = await db.execute(
        select(
            func.count(TicketAnalysis.id).label("total"),
            func.avg(TicketAnalysis.sentiment_score).label("avg_sentiment"),
            func.avg(TicketAnalysis.processing_ms).label("avg_ms"),
            func.count(TicketAnalysis.id).filter(
                TicketAnalysis.priority == "urgent"
            ).label("urgent_count"),
        ).where(func.date(TicketAnalysis.created_at) == today)
    )
    row = rows.one()

    result = QueueMetrics(
        open_tickets         = open_count,
        pending_tickets      = pending_count,
        new_tickets          = new_count,
        urgent_count         = row.urgent_count or 0,
        avg_sentiment        = round(float(row.avg_sentiment), 2) if row.avg_sentiment else None,
        avg_processing_ms    = round(float(row.avg_ms), 0) if row.avg_ms else None,
        total_analysed_today = row.total or 0,
    )
    await set_cache("metrics:queue", result.model_dump(), ttl=60)
    return result


@router.get("/metrics/sentiment")
async def sentiment_trend(days: int = Query(30, ge=7, le=90), db: AsyncSession = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)
    rows = await db.execute(
        select(
            func.date(TicketAnalysis.created_at).label("date"),
            func.avg(TicketAnalysis.sentiment_score).label("avg_sentiment"),
            func.count(TicketAnalysis.id).label("ticket_count"),
        )
        .where(TicketAnalysis.created_at >= since)
        .group_by(func.date(TicketAnalysis.created_at))
        .order_by(func.date(TicketAnalysis.created_at))
    )
    return [{"date": str(r.date),
             "avg_sentiment": round(float(r.avg_sentiment), 2) if r.avg_sentiment else None,
             "ticket_count": r.ticket_count} for r in rows]


@router.get("/metrics/volume")
async def ticket_volume(days: int = Query(30, ge=7, le=90), db: AsyncSession = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)
    rows = await db.execute(
        select(
            func.date(TicketAnalysis.created_at).label("date"),
            func.count(TicketAnalysis.id).label("total"),
            func.count(TicketAnalysis.id).filter(
                TicketAnalysis.flagged_for_review == True  # noqa: E712
            ).label("escalations"),
        )
        .where(TicketAnalysis.created_at >= since)
        .group_by(func.date(TicketAnalysis.created_at))
        .order_by(func.date(TicketAnalysis.created_at))
    )
    return [{"date": str(r.date), "total": r.total, "escalations": r.escalations} for r in rows]


@router.get("/metrics/categories")
async def category_breakdown(days: int = Query(30, ge=7, le=90), db: AsyncSession = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)
    rows = await db.execute(
        select(
            TicketAnalysis.category,
            func.count(TicketAnalysis.id).label("count"),
            func.avg(TicketAnalysis.sentiment_score).label("avg_sentiment"),
        )
        .where(TicketAnalysis.created_at >= since, TicketAnalysis.category.isnot(None))
        .group_by(TicketAnalysis.category)
        .order_by(func.count(TicketAnalysis.id).desc())
    )
    return [{"category": r.category, "count": r.count,
             "avg_sentiment": round(float(r.avg_sentiment), 2) if r.avg_sentiment else None}
            for r in rows]
