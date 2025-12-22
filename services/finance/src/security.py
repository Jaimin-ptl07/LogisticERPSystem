"""
Security utilities for Finance Service
"""
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from src.middleware.auth import TokenData, get_token_data

# Security scheme
security = HTTPBearer()


async def require_permissions(required_permissions: List[str]):
    """Dependency to require specific permissions"""
    def permission_checker(token_data: TokenData = Depends(get_token_data)) -> TokenData:
        if not token_data.is_super_user():
            for permission in required_permissions:
                if not token_data.has_permission(permission):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Permission denied: {permission} required"
                    )
        return token_data
    return permission_checker


async def require_any_permission(required_permissions: List[str]):
    """Dependency to require any of the specified permissions"""
    def permission_checker(token_data: TokenData = Depends(get_token_data)) -> TokenData:
        if not token_data.is_super_user():
            has_permission = any(
                token_data.has_permission(permission)
                for permission in required_permissions
            )
            if not has_permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: one of {required_permissions} required"
                )
        return token_data
    return permission_checker


# Re-export from middleware
from src.middleware.auth import (
    get_current_user_id,
    get_current_tenant_id,
    get_token_data,
    TokenData,
)