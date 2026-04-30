"""
Global exception handlers — consistent JSON error responses.
"""

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.shared.zendesk import ZendeskAPIError

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        logger.warning("validation_error", extra={"path": request.url.path, "errors": exc.errors()})
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"error": "validation_error", "detail": exc.errors()},
        )

    @app.exception_handler(ZendeskAPIError)
    async def zendesk_error_handler(request: Request, exc: ZendeskAPIError):
        logger.error("zendesk_api_error", extra={"status": exc.status_code, "detail": exc.detail})
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={"error": "zendesk_api_error", "detail": exc.detail},
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        logger.error("value_error", extra={"detail": str(exc)})
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "bad_request", "detail": str(exc)},
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        logger.exception("unhandled_exception", extra={"path": request.url.path})
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "detail": "An unexpected error occurred"},
        )
