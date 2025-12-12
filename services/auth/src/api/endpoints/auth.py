"""
Authentication endpoints
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login endpoint"""
    # TODO: Implement actual authentication
    return {
        "access_token": "dummy-token",
        "token_type": "bearer"
    }


@router.get("/me")
async def get_current_user():
    """Get current user info"""
    return {"email": "test@example.com", "role": "admin"}