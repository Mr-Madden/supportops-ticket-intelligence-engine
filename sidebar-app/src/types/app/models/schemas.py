"""
Pydantic schemas for request validation and API response serialisation.
"""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    total: int
    page: int
    per_page: int
    pages: int


class AnalysisResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    zendesk_ticket_id: int
    created_at: datetime

    tags: list[str] | None = None
    category: str | None = None
    sub_category: str | None = None

    sentiment_score: int | None = None
    sentiment_label: str | None = None
    escalation_risk: str | None = None

    priority: str | None = None
    priority_confidence: float | None = None
    priority_reason: str | None = None

    summary: str | None = None
    key_issue: str | None = None
    customer_ask: str | None = None

    routing_group: str | None = None
    routing_reason: str | None = None
    routing_confidence: float | None = None
    routing_fallback: str | None = None

    processing_ms: int | None = None
    flagged_for_review: bool = False


class AnalyzeRequest(BaseModel):
    ticket_id: int
    subject: str = ""
    body: str
    customer_tier: str = "normal"
    ticket_count: int = 0


class BulkAnalyzeRequest(BaseModel):
    ticket_ids: list[int] = Field(..., min_length=1, max_length=500)


class FeedbackRequest(BaseModel):
    correct_category: str | None = None
    correct_priority: str | None = None
    correct_routing_group: str | None = None
    feedback_note: str | None = None


class AnalysisList(PaginatedResponse):
    items: list[AnalysisResult]


class WebhookTicketPayload(BaseModel):
    id: int
    subject: str = ""
    description: str = ""
    status: str = "new"
    priority: str | None = None
    tags: list[str] = []
    requester_id: int | None = None


class WebhookPayload(BaseModel):
    ticket: WebhookTicketPayload


class WebhookAck(BaseModel):
    status: Literal["queued", "skipped"]
    ticket_id: int
    message: str = ""


class TagCreate(BaseModel):
    tag_name: str = Field(..., min_length=1, max_length=100)
    category: str | None = None
    description: str | None = None


class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tag_name: str
    category: str | None
    description: str | None
    active: bool
    created_at: datetime


class QueueMetrics(BaseModel):
    open_tickets: int = 0
    pending_tickets: int = 0
    new_tickets: int = 0
    urgent_count: int = 0
    avg_sentiment: float | None = None
    avg_processing_ms: float | None = None
    total_analysed_today: int = 0
