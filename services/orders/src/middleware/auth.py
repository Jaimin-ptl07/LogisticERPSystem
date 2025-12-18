"""
Authentication middleware for Orders Service
"""
from typing import List, Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

from src.security.auth import verify_token, extract_token_from_header

logger = logging.getLogger(__name__)


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle JWT authentication for all requests (optional)
    """

    def __init__(self, app, skip_paths: List[str] = None):
        """
        Initialize authentication middleware

        Args:
            app: ASGI application
            skip_paths: List of paths to skip authentication
        """
        super().__init__(app)
        self.skip_paths = skip_paths or [
            "/health",
            "/ready",
            "/metrics",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/favicon.ico",
            "/static",
        ]

    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Process request through authentication middleware

        Args:
            request: Incoming request
            call_next: Next middleware in chain

        Returns:
            HTTP response
        """
        # Check if path should be skipped
        if self._should_skip_path(request.url.path):
            return await call_next(request)

        # Extract token from Authorization header (optional)
        authorization = request.headers.get("Authorization")

        if authorization:
            try:
                # Extract token from header
                token = extract_token_from_header(authorization)

                # Verify token and get user data
                token_data = verify_token(token)

                # Add user context to request state
                request.state.user_id = token_data.user_id
                request.state.tenant_id = token_data.tenant_id
                request.state.role_id = token_data.role_id
                request.state.permissions = token_data.permissions
                request.state.authenticated = True

                logger.debug(f"Authenticated user {token_data.user_id} for {request.url.path}")

            except Exception as e:
                # Log error but don't block the request
                logger.warning(f"Authentication failed but continuing: {str(e)}")
                request.state.authenticated = False
        else:
            # No authorization header provided
            request.state.authenticated = False

        # Continue to next middleware regardless of auth
        return await call_next(request)

    def _should_skip_path(self, path: str) -> bool:
        """
        Check if the path should be skipped from authentication

        Args:
            path: Request path

        Returns:
            True if path should be skipped, False otherwise
        """
        # Skip exact matches
        if path in self.skip_paths:
            return True

        # Skip paths that start with any skip path
        for skip_path in self.skip_paths:
            if skip_path.endswith("/"):
                if path.startswith(skip_path):
                    return True
            else:
                if path == skip_path or path.startswith(skip_path + "/"):
                    return True

        return False