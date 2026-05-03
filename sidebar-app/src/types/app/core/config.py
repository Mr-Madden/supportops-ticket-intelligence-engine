"""
Application configuration — loaded from environment variables.
Copy .env.example to .env and fill in values before running.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    APP_ENV: str = "development"
    LOG_LEVEL: str = "info"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost:5432/supportops"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_TTL_DEFAULT: int = 300  # 5 minutes

    # Anthropic
    ANTHROPIC_API_KEY: str
    ANTHROPIC_MODEL: str = "claude-sonnet-4-20250514"
    ANTHROPIC_MAX_TOKENS: int = 1024

    # Zendesk
    ZENDESK_SUBDOMAIN: str
    ZENDESK_EMAIL: str
    ZENDESK_API_TOKEN: str
    ZENDESK_WEBHOOK_SECRET: str = ""

    # Auth / CORS
    JWT_SECRET: str = "change-me-in-production"
    JWT_EXPIRY_HOURS: int = 24
    CORS_ORIGINS: List[str] = ["*"]

    # Feature flags
    PUSH_TAGS_TO_ZENDESK: bool = True
    PUSH_PRIORITY_TO_ZENDESK: bool = True
    PUSH_INTERNAL_NOTE: bool = True
    ENABLE_DEDUP: bool = True


settings = Settings()
