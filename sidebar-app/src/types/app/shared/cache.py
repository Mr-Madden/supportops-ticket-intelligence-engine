"""
Redis cache wrapper.

Provides a simple async get/set/delete/invalidate interface
backed by Redis. Used by runLLM() and the metrics aggregation layer.
"""

import json
import logging
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


async def get_cache(key: str) -> Any | None:
    """
    Retrieve a cached value by key.
    Returns the deserialised value, or None if not found / error.
    """
    try:
        raw = await get_redis().get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as exc:
        logger.warning("cache_get_error", extra={"key": key, "error": str(exc)})
        return None


async def set_cache(key: str, value: Any, ttl: int = settings.REDIS_TTL_DEFAULT) -> bool:
    """
    Store a value in cache with a TTL (seconds).
    Returns True on success, False on error.
    """
    try:
        serialised = json.dumps(value, default=str)
        await get_redis().setex(key, ttl, serialised)
        return True
    except Exception as exc:
        logger.warning("cache_set_error", extra={"key": key, "error": str(exc)})
        return False


async def delete_cache(key: str) -> bool:
    """Delete a cache entry. Returns True if the key existed."""
    try:
        result = await get_redis().delete(key)
        return result > 0
    except Exception as exc:
        logger.warning("cache_delete_error", extra={"key": key, "error": str(exc)})
        return False


async def invalidate_prefix(prefix: str) -> int:
    """Delete all keys matching a prefix pattern. Returns count deleted."""
    try:
        r = get_redis()
        keys = await r.keys(f"{prefix}*")
        if not keys:
            return 0
        return await r.delete(*keys)
    except Exception as exc:
        logger.warning("cache_invalidate_error", extra={"prefix": prefix, "error": str(exc)})
        return 0
