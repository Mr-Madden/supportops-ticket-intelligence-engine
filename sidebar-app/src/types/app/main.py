"""
SupportOps AI Suite — Project #1
AI Ticket Intelligence Engine — FastAPI application entry point
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import init_db, close_db
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.error_handler import register_exception_handlers
from app.routers import webhook, analyze, admin, metrics
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="SupportOps AI — Ticket Intelligence Engine",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.APP_ENV != "production" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)

register_exception_handlers(app)

app.include_router(webhook.router, prefix="/webhook",  tags=["Webhook"])
app.include_router(analyze.router, prefix="/api/v1",   tags=["Analysis"])
app.include_router(admin.router,   prefix="/api/v1",   tags=["Admin"])
app.include_router(metrics.router, prefix="/api/v1",   tags=["Metrics"])


@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "service": "ticket-intelligence-engine", "version": "1.0.0"}
