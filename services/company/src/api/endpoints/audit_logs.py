"""
Audit Log endpoints for Company Service
Provides audit logging functionality for all services in the ERP system
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from datetime import datetime
import uuid

from src.database import get_db, AuditLog
from src.schemas import (
    AuditLogCreate,
    AuditLogResponse,
    AuditLogQueryParams,
    AuditLog as AuditLogSchema
)

from src.security import (
    TokenData,
    require_permissions,
    get_current_tenant_id,
    get_current_user_id,
    AUDIT_CREATE,
    AUDIT_READ,
    AUDIT_STATS,
)

router = APIRouter()


@router.post("/audit-logs", response_model=AuditLogSchema)
async def create_audit_log(
    audit_data: AuditLogCreate,
    request: Request,
    token_data: TokenData = Depends(require_permissions(AUDIT_CREATE)),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new audit log entry.
    This endpoint is called by other services to log their actions.
    """
    try:
        # Extract request context
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        request_id = request.headers.get("x-request-id")

        # Create audit log entry
        audit_log = AuditLog(
            id=uuid.uuid4(),
            tenant_id=audit_data.tenant_id,
            user_id=audit_data.user_id,
            user_name=audit_data.user_name,
            user_role=audit_data.user_role,
            user_email=audit_data.user_email,
            entity_type=audit_data.entity_type,
            entity_id=audit_data.entity_id,
            entity_name=audit_data.entity_name,
            action=audit_data.action,
            module=audit_data.module,
            sub_module=audit_data.sub_module,
            old_status=audit_data.old_status,
            new_status=audit_data.new_status,
            status_changed=audit_data.status_changed,
            description=audit_data.description,
            reason=audit_data.reason,
            notes=audit_data.notes,
            meta_data=audit_data.meta_data,
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
            action_timestamp=datetime.utcnow()
        )

        db.add(audit_log)
        await db.commit()
        await db.refresh(audit_log)

        return audit_log

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create audit log: {str(e)}")


@router.get("/audit-logs", response_model=AuditLogResponse)
async def get_audit_logs(
    tenant_id: str = Query(..., description="Tenant ID"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    entity_id: Optional[str] = Query(None, description="Filter by entity ID"),
    module: Optional[str] = Query(None, description="Filter by module"),
    action: Optional[str] = Query(None, description="Filter by action"),
    new_status: Optional[str] = Query(None, description="Filter by new status"),
    status_changed: Optional[bool] = Query(None, description="Filter by status changed"),
    search: Optional[str] = Query(None, description="Search in entity_name, description, notes"),
    date_from: Optional[datetime] = Query(None, description="Filter by date from"),
    date_to: Optional[datetime] = Query(None, description="Filter by date to"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=200, description="Items per page"),
    sort_by: str = Query("action_timestamp", description="Sort by field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    token_data: TokenData = Depends(require_permissions(AUDIT_READ)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get audit logs with filtering and pagination.
    Only accessible by admin users.
    """
    try:
        # Build base query
        query = select(AuditLog).where(AuditLog.tenant_id == tenant_id)

        # Apply filters
        if user_id:
            query = query.where(AuditLog.user_id == user_id)

        if entity_type:
            query = query.where(AuditLog.entity_type == entity_type)

        if entity_id:
            query = query.where(AuditLog.entity_id == entity_id)

        if module:
            query = query.where(AuditLog.module == module)

        if action:
            query = query.where(AuditLog.action == action)

        if new_status:
            query = query.where(AuditLog.new_status == new_status)

        if status_changed is not None:
            query = query.where(AuditLog.status_changed == status_changed)

        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    AuditLog.entity_name.ilike(search_pattern),
                    AuditLog.description.ilike(search_pattern),
                    AuditLog.notes.ilike(search_pattern)
                )
            )

        if date_from:
            query = query.where(AuditLog.action_timestamp >= date_from)

        if date_to:
            query = query.where(AuditLog.action_timestamp <= date_to)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply sorting
        sort_column = getattr(AuditLog, sort_by, AuditLog.action_timestamp)
        if sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        # Apply pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)

        # Execute query
        result = await db.execute(query)
        audit_logs = result.scalars().all()

        # Calculate total pages
        pages = (total + per_page - 1) // per_page if total > 0 else 1

        return AuditLogResponse(
            items=audit_logs,
            total=total,
            page=page,
            per_page=per_page,
            pages=pages
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit logs: {str(e)}")


@router.get("/audit-logs/stats", response_model=Dict[str, Any])
async def get_audit_log_stats(
    tenant_id: str = Query(..., description="Tenant ID"),
    date_from: Optional[datetime] = Query(None, description="Filter by date from"),
    date_to: Optional[datetime] = Query(None, description="Filter by date to"),
    token_data: TokenData = Depends(require_permissions(AUDIT_READ)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get audit log statistics for admin dashboard.
    """
    try:
        # Build base query
        query = select(AuditLog).where(AuditLog.tenant_id == tenant_id)

        if date_from:
            query = query.where(AuditLog.action_timestamp >= date_from)

        if date_to:
            query = query.where(AuditLog.action_timestamp <= date_to)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get count by module
        module_query = select(
            AuditLog.module,
            func.count().label('count')
        ).where(AuditLog.tenant_id == tenant_id)

        if date_from:
            module_query = module_query.where(AuditLog.action_timestamp >= date_from)

        if date_to:
            module_query = module_query.where(AuditLog.action_timestamp <= date_to)

        module_query = module_query.group_by(AuditLog.module)
        module_result = await db.execute(module_query)
        by_module = {row.module: row.count for row in module_result}

        # Get count by action
        action_query = select(
            AuditLog.action,
            func.count().label('count')
        ).where(AuditLog.tenant_id == tenant_id)

        if date_from:
            action_query = action_query.where(AuditLog.action_timestamp >= date_from)

        if date_to:
            action_query = action_query.where(AuditLog.action_timestamp <= date_to)

        action_query = action_query.group_by(AuditLog.action)
        action_result = await db.execute(action_query)
        by_action = {row.action: row.count for row in action_result}

        # Get count by entity type
        entity_query = select(
            AuditLog.entity_type,
            func.count().label('count')
        ).where(AuditLog.tenant_id == tenant_id)

        if date_from:
            entity_query = entity_query.where(AuditLog.action_timestamp >= date_from)

        if date_to:
            entity_query = entity_query.where(AuditLog.action_timestamp <= date_to)

        entity_query = entity_query.group_by(AuditLog.entity_type)
        entity_result = await db.execute(entity_query)
        by_entity_type = {row.entity_type: row.count for row in entity_result}

        # Get count by user
        user_query = select(
            AuditLog.user_id,
            AuditLog.user_name,
            func.count().label('count')
        ).where(AuditLog.tenant_id == tenant_id)

        if date_from:
            user_query = user_query.where(AuditLog.action_timestamp >= date_from)

        if date_to:
            user_query = user_query.where(AuditLog.action_timestamp <= date_to)

        user_query = user_query.group_by(AuditLog.user_id, AuditLog.user_name)
        user_query = user_query.order_by(func.count().desc()).limit(10)
        user_result = await db.execute(user_query)
        top_users = [
            {"user_id": row.user_id, "user_name": row.user_name, "count": row.count}
            for row in user_result
        ]

        # Get status change count
        status_change_query = select(func.count()).where(
            and_(
                AuditLog.tenant_id == tenant_id,
                AuditLog.status_changed == True
            )
        )

        if date_from:
            status_change_query = status_change_query.where(AuditLog.action_timestamp >= date_from)

        if date_to:
            status_change_query = status_change_query.where(AuditLog.action_timestamp <= date_to)

        status_change_result = await db.execute(status_change_query)
        status_changes = status_change_result.scalar() or 0

        return {
            "total": total,
            "by_module": by_module,
            "by_action": by_action,
            "by_entity_type": by_entity_type,
            "top_users": top_users,
            "status_changes": status_changes
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit log stats: {str(e)}")


@router.get("/audit-logs/{audit_log_id}", response_model=AuditLogSchema)
async def get_audit_log(
    audit_log_id: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    token_data: TokenData = Depends(require_permissions(AUDIT_READ)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific audit log entry by ID.
    """
    try:
        query = select(AuditLog).where(
            and_(
                AuditLog.id == uuid.UUID(audit_log_id),
                AuditLog.tenant_id == tenant_id
            )
        )

        result = await db.execute(query)
        audit_log = result.scalar_one_or_none()

        if not audit_log:
            raise HTTPException(status_code=404, detail="Audit log not found")

        return audit_log

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid audit log ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit log: {str(e)}")


@router.get("/audit-logs/entity/{entity_type}/{entity_id}", response_model=List[AuditLogSchema])
async def get_entity_audit_trail(
    entity_type: str,
    entity_id: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    token_data: TokenData = Depends(require_permissions(AUDIT_READ)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get complete audit trail for a specific entity.
    Returns all audit logs for the given entity_type and entity_id.
    """
    try:
        query = select(AuditLog).where(
            and_(
                AuditLog.tenant_id == tenant_id,
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id
            )
        ).order_by(AuditLog.action_timestamp.asc())

        result = await db.execute(query)
        audit_logs = result.scalars().all()

        return list(audit_logs)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch entity audit trail: {str(e)}")
