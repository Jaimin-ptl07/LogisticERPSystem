"""
Tenant management endpoints
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_tenants():
    """List all tenants"""
    return {"tenants": []}


@router.post("/")
async def create_tenant():
    """Create a new tenant"""
    return {"message": "Tenant created successfully"}