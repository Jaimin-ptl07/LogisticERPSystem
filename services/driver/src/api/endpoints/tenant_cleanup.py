"""
Internal endpoint for tenant data cleanup in Driver service
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
import logging

from ...database import get_db, Driver

router = APIRouter()
logger = logging.getLogger(__name__)


@router.delete("/tenant/{tenant_id}")
async def delete_tenant_data(
    tenant_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete all driver data for a tenant"""
    try:
        # Delete drivers
        await db.execute(delete(Driver).where(Driver.tenant_id == tenant_id))

        await db.commit()
        logger.info(f"Deleted driver data for tenant {tenant_id}")
        return {"message": "Tenant driver data deleted"}

    except Exception as e:
        logger.error(f"Error deleting tenant driver data: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
