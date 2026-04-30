"""
SQLAlchemy ORM models for the Ticket Intelligence Engine.

Tables:
  - ticket_analysis    Core analysis results per ticket
  - tag_taxonomy       Approved tag dictionary
  - routing_rules      Queue routing configuration
  - processing_log     Audit trail for all processing events
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class TicketAnalysis(Base):
    __tablename__ = "ticket_analysis"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    zendesk_ticket_id: Mapped[int] = mapped_column(BigInteger, nullable=False, unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    subject: Mapped[str | None] = mapped_column(Text)
    body_hash: Mapped[str | None] = mapped_column(String(64))

    tags: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    category: Mapped[str | None] = mapped_column(String(100))
    sub_category: Mapped[str | None] = mapped_column(String(100))

    sentiment_score: Mapped[int | None] = mapped_column(
        SmallInteger,
        CheckConstraint("sentiment_score BETWEEN 1 AND 5", name="ck_sentiment_range"),
    )
    sentiment_label: Mapped[str | None] = mapped_column(String(50))
    escalation_risk: Mapped[str | None] = mapped_column(String(20))

    priority: Mapped[str | None] = mapped_column(String(20))
    priority_confidence: Mapped[float | None] = mapped_column(Numeric(4, 3))
    priority_reason: Mapped[str | None] = mapped_column(Text)

    summary: Mapped[str | None] = mapped_column(Text)
    key_issue: Mapped[str | None] = mapped_column(Text)
    customer_ask: Mapped[str | None] = mapped_column(Text)

    routing_group: Mapped[str | None] = mapped_column(String(100))
    routing_reason: Mapped[str | None] = mapped_column(Text)
    routing_confidence: Mapped[float | None] = mapped_column(Numeric(4, 3))
    routing_fallback: Mapped[str | None] = mapped_column(String(100))

    model_version: Mapped[str | None] = mapped_column(String(50))
    processing_ms: Mapped[int | None] = mapped_column(Integer)
    flagged_for_review: Mapped[bool] = mapped_column(Boolean, default=False)


class TagTaxonomy(Base):
    __tablename__ = "tag_taxonomy"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tag_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    category: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RoutingRule(Base):
    __tablename__ = "routing_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_name: Mapped[str] = mapped_column(String(100), nullable=False)
    keywords: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    categories: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    priority: Mapped[str | None] = mapped_column(String(20))
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class ProcessingLog(Base):
    __tablename__ = "processing_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zendesk_ticket_id: Mapped[int | None] = mapped_column(BigInteger, index=True)
    event_type: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[str | None] = mapped_column(String(20))
    error_message: Mapped[str | None] = mapped_column(Text)
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
