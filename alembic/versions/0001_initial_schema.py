"""Initial schema — all four tables

Revision ID: 0001
Revises:
Create Date: 2025-01-01 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, UUID

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    op.create_table(
        "ticket_analysis",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("zendesk_ticket_id", sa.BigInteger, nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("subject", sa.Text),
        sa.Column("body_hash", sa.String(64)),
        sa.Column("tags", ARRAY(sa.Text)),
        sa.Column("category", sa.String(100)),
        sa.Column("sub_category", sa.String(100)),
        sa.Column("sentiment_score", sa.SmallInteger,
                  sa.CheckConstraint("sentiment_score BETWEEN 1 AND 5", name="ck_sentiment_range")),
        sa.Column("sentiment_label", sa.String(50)),
        sa.Column("escalation_risk", sa.String(20)),
        sa.Column("priority", sa.String(20)),
        sa.Column("priority_confidence", sa.Numeric(4, 3)),
        sa.Column("priority_reason", sa.Text),
        sa.Column("summary", sa.Text),
        sa.Column("key_issue", sa.Text),
        sa.Column("customer_ask", sa.Text),
        sa.Column("routing_group", sa.String(100)),
        sa.Column("routing_reason", sa.Text),
        sa.Column("routing_confidence", sa.Numeric(4, 3)),
        sa.Column("routing_fallback", sa.String(100)),
        sa.Column("model_version", sa.String(50)),
        sa.Column("processing_ms", sa.Integer),
        sa.Column("flagged_for_review", sa.Boolean, server_default="false"),
    )
    op.create_index("ix_ticket_analysis_ticket_id", "ticket_analysis", ["zendesk_ticket_id"])
    op.create_index("ix_ticket_analysis_category",  "ticket_analysis", ["category"])
    op.create_index("ix_ticket_analysis_created_at","ticket_analysis", ["created_at"])

    op.create_table(
        "tag_taxonomy",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tag_name", sa.String(100), unique=True, nullable=False),
        sa.Column("category", sa.String(100)),
        sa.Column("description", sa.Text),
        sa.Column("active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_tag_taxonomy_tag_name", "tag_taxonomy", ["tag_name"])

    op.create_table(
        "routing_rules",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("group_name", sa.String(100), nullable=False),
        sa.Column("keywords", ARRAY(sa.Text)),
        sa.Column("categories", ARRAY(sa.Text)),
        sa.Column("priority", sa.String(20)),
        sa.Column("active", sa.Boolean, server_default="true"),
    )

    op.create_table(
        "processing_log",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("zendesk_ticket_id", sa.BigInteger),
        sa.Column("event_type", sa.String(50)),
        sa.Column("status", sa.String(20)),
        sa.Column("error_message", sa.Text),
        sa.Column("duration_ms", sa.Integer),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_processing_log_ticket_id",  "processing_log", ["zendesk_ticket_id"])
    op.create_index("ix_processing_log_created_at", "processing_log", ["created_at"])


def downgrade() -> None:
    op.drop_table("processing_log")
    op.drop_table("routing_rules")
    op.drop_table("tag_taxonomy")
    op.drop_table("ticket_analysis")
