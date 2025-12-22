"""
User management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ...database import get_db
from ...services.user_service import UserService
from ...schemas import UserCreate, User
from ...dependencies import get_current_user_token, TokenData

router = APIRouter()


@router.get("/", response_model=List[User])
async def list_users(
    token_data: TokenData = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    """List all users for the current tenant"""
    # Only admin users can list users
    if not token_data.permissions or "users:list" not in token_data.permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can list users"
        )

    # Get users for the tenant
    users = await UserService.get_users_by_tenant(db, token_data.tenant_id)
    return [User.model_validate(user) for user in users]


@router.post("/", response_model=User, status_code=201)
async def create_user(
    user_data: UserCreate,
    token_data: TokenData = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    """Create a new user for the tenant"""
    # For now, allow any authenticated admin/superuser to create users
    # TODO: Add proper permission checking

    # If the creator is a superuser (no tenant_id), require tenant_id in user_data
    if not token_data.tenant_id or token_data.tenant_id == "":
        # Check if user_data has a valid tenant_id (not None, not "None", not empty)
        if not user_data.tenant_id or user_data.tenant_id in ["", "None", None]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="tenant_id is required when creating users as a superuser"
            )
    else:
        # For regular users, ensure user is created for the same tenant
        user_data.tenant_id = token_data.tenant_id

    # Create the user
    user = await UserService.create_user(db, user_data)
    return User.model_validate(user)