"""
Async PostgreSQL session management using SQLAlchemy + asyncpg.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=(settings.APP_ENV == "development"),
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def init_db() -> None:
    """Create all tables on startup (development). Use Alembic in production."""
    if settings.APP_ENV == "development":
        from app.db import models  # noqa: F401 — import to register models
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    await engine.dispose()


async def get_db():
    """FastAPI dependency that yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
