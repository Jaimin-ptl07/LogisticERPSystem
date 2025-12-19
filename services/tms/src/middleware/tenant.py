"""
Tenant isolation middleware for TMS Service
"""
from typing import Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

logger = logging.getLogger(__name__)


class TenantContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle tenant context in database queries
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Ensure tenant context is available in request

        Args:
            request: Incoming request
            call_next: Next middleware in chain

        Returns:
            HTTP response
        """
        # Ensure tenant_id is in request state
        if not hasattr(request.state, 'tenant_id'):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant context required"
            )

        # Add tenant_id to request headers for database session
        request.headers["X-Tenant-ID"] = request.state.tenant_id

        response = await call_next(request)
        return response


class TenantIsolationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce tenant isolation at the application level
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Process request and ensure tenant isolation

        Args:
            request: Incoming request
            call_next: Next middleware in chain

        Returns:
            HTTP response
        """
        # Skip tenant check for health endpoints
        if request.url.path in ["/health", "/ready", "/metrics"]:
            return await call_next(request)

        # Ensure tenant is present
        if not hasattr(request.state, 'tenant_id'):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant ID required"
            )

        # Validate tenant format
        tenant_id = request.state.tenant_id
        if not tenant_id or len(tenant_id) < 10:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid tenant ID"
            )

        # Log tenant access
        logger.debug(f"Processing request for tenant: {tenant_id}")

        response = await call_next(request)

        # Add tenant headers to response
        response.headers["X-Tenant-ID"] = tenant_id

        return response