"""
Structured request logging middleware.
Logs method, path, status code, and duration for every request.
"""

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())[:8]
        start = time.time()

        response = await call_next(request)

        duration_ms = round((time.time() - start) * 1000)
        logger.info(
            "http_request",
            extra={
                "request_id":  request_id,
                "method":      request.method,
                "path":        request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        response.headers["X-Request-ID"] = request_id
        return response
