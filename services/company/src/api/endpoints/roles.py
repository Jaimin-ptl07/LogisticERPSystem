"""
Role management endpoints
"""
from typing import List, Optional
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import httpx

from src.database import AsyncSessionLocal, CompanyRole, EmployeeProfile
from src.schemas import (
    CompanyRole as CompanyRoleSchema,
    CompanyRoleCreate,
    CompanyRoleUpdate,
    PaginatedResponse
)
from src.config_local import settings
from src.security import (
    TokenData,
    get_current_tenant_id,
    get_current_user_id,
    require_permissions,
    require_any_permission,
    ROLE_READ,
    ROLE_CREATE,
    ROLE_UPDATE,
    ROLE_DELETE,
    ROLE_ASSIGN,
    USER_READ_ALL,
    USER_READ,
)

router = APIRouter()
logger = logging.getLogger(__name__)


# Dependency to get database session
async def get_db() -> AsyncSession:
    """Get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@router.get("/auth-roles")
async def get_auth_roles(
    request: Request,
    token_data: TokenData = Depends(require_any_permission([*ROLE_READ]))
):
    """
    Get roles from auth service
    This endpoint calls the auth service's roles API and returns the roles

    Requires: ROLE_READ permission
    """
    auth_service_url = settings.AUTH_SERVICE_URL

    # Get authorization header from request to pass to auth service
    auth_headers = {
        "Accept": "application/json"
    }
    auth_header = request.headers.get("authorization")
    if auth_header:
        auth_headers["Authorization"] = auth_header

    try:
        # Enable follow_redirects to handle 307 redirects
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(
                f"{auth_service_url}/api/v1/roles",
                headers=auth_headers
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Auth service returned error: {response.text}"
                )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Auth service request timed out"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to reach auth service: {str(e)}"
        )


@router.get("/", response_model=PaginatedResponse)
async def list_roles(
    token_data: TokenData = Depends(require_permissions([*ROLE_READ])),
    tenant_id: str = Depends(get_current_tenant_id),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    include_system: Optional[bool] = Query(True),
    db: AsyncSession = Depends(get_db)
):
    """
    List all roles for the current tenant

    Requires: ROLE_READ permission
    """

    # Build query
    query = select(CompanyRole).where(CompanyRole.tenant_id == tenant_id)

    # Apply filters
    if search:
        query = query.where(
            CompanyRole.role_name.ilike(f"%{search}%") |
            CompanyRole.display_name.ilike(f"%{search}%") |
            CompanyRole.description.ilike(f"%{search}%")
        )

    if is_active is not None:
        query = query.where(CompanyRole.is_active == is_active)

    if not include_system:
        query = query.where(CompanyRole.is_system_role == False)

    # Count total items
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page).order_by(
        CompanyRole.is_system_role.desc(),
        CompanyRole.display_name
    )

    # Execute query without loading problematic relationships
    # We'll load employees count separately to avoid recursion
    result = await db.execute(query)
    roles = result.scalars().all()

    # Calculate pages
    pages = (total + per_page - 1) // per_page

    # Convert roles to dict and handle None values for is_active
    validated_roles = []
    for role in roles:
        # Get employee count separately to avoid loading full relationships
        employee_count_query = select(func.count()).select_from(EmployeeProfile).where(
            EmployeeProfile.role_id == role.id
        )
        employee_count_result = await db.execute(employee_count_query)
        employee_count = employee_count_result.scalar() or 0

        role_dict = {
            'id': role.id,
            'tenant_id': role.tenant_id,
            'role_name': role.role_name,
            'display_name': role.display_name,
            'name': role.display_name,  # Add name field for frontend compatibility
            'description': role.description,
            'permissions': role.permissions,
            'is_active': role.is_active if role.is_active is not None else True,  # Handle None values
            'is_system_role': role.is_system_role if role.is_system_role is not None else False,
            'created_at': role.created_at,
            'updated_at': role.updated_at,
            'employees': [],  # Don't load full employee objects to avoid recursion
            'invitations': []  # Don't load full invitation objects to avoid recursion
        }
        validated_roles.append(CompanyRoleSchema.model_validate(role_dict))

    return PaginatedResponse(
        items=validated_roles,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/{role_id}", response_model=CompanyRoleSchema)
async def get_role(
    role_id: str,
    token_data: TokenData = Depends(require_permissions([*ROLE_READ])),
    tenant_id: str = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific role by ID

    Requires: ROLE_READ permission
    """

    # Get role without loading problematic relationships
    query = select(CompanyRole).where(
        CompanyRole.id == role_id,
        CompanyRole.tenant_id == tenant_id
    )

    result = await db.execute(query)
    role = result.scalar_one_or_none()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Convert role to dict and handle None values for is_active
    role_dict = {
        'id': role.id,
        'tenant_id': role.tenant_id,
        'role_name': role.role_name,
        'display_name': role.display_name,
        'description': role.description,
        'permissions': role.permissions,
        'is_active': role.is_active if role.is_active is not None else True,  # Handle None values
        'is_system_role': role.is_system_role if role.is_system_role is not None else False,
        'created_at': role.created_at,
        'updated_at': role.updated_at,
        'employees': [],  # Don't load full employee objects to avoid recursion
        'invitations': []  # Don't load full invitation objects to avoid recursion
    }

    return CompanyRoleSchema.model_validate(role_dict)


@router.post("/", response_model=CompanyRoleSchema, status_code=201)
async def create_role(
    role_data: CompanyRoleCreate,
    token_data: TokenData = Depends(require_permissions([*ROLE_CREATE])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new role

    Requires: ROLE_CREATE permission
    """

    # Check if role name already exists
    existing_query = select(CompanyRole).where(
        CompanyRole.role_name == role_data.role_name,
        CompanyRole.tenant_id == tenant_id
    )
    existing_result = await db.execute(existing_query)
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Role with this name already exists"
        )

    # Create new role
    role = CompanyRole(
        tenant_id=tenant_id,
        **role_data.model_dump()
    )

    db.add(role)
    await db.commit()
    await db.refresh(role)

    # Convert role to dict and handle None values for is_active
    role_dict = {
        'id': role.id,
        'tenant_id': role.tenant_id,
        'role_name': role.role_name,
        'display_name': role.display_name,
        'description': role.description,
        'permissions': role.permissions,
        'is_active': role.is_active if role.is_active is not None else True,  # Handle None values
        'is_system_role': role.is_system_role if role.is_system_role is not None else False,
        'created_at': role.created_at,
        'updated_at': role.updated_at,
        'employees': [],  # New role has no employees yet
        'invitations': []  # New role has no invitations yet
    }

    return CompanyRoleSchema.model_validate(role_dict)


@router.put("/{role_id}", response_model=CompanyRoleSchema)
async def update_role(
    role_id: str,
    role_data: CompanyRoleUpdate,
    token_data: TokenData = Depends(require_permissions([*ROLE_UPDATE])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a role

    Requires: ROLE_UPDATE permission
    """

    # Get existing role
    query = select(CompanyRole).where(
        CompanyRole.id == role_id,
        CompanyRole.tenant_id == tenant_id
    )
    result = await db.execute(query)
    role = result.scalar_one_or_none()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Prevent updating system roles
    if role.is_system_role:
        raise HTTPException(
            status_code=403,
            detail="Cannot update system roles"
        )

    # Update role
    update_data = role_data.model_dump(exclude_unset=True)

    # Prevent changing system role flag
    if "is_system_role" in update_data:
        update_data.pop("is_system_role")

    # Check role name uniqueness if updating
    if "role_name" in update_data:
        existing_query = select(CompanyRole).where(
            CompanyRole.role_name == update_data["role_name"],
            CompanyRole.tenant_id == tenant_id,
            CompanyRole.id != role_id
        )
        existing_result = await db.execute(existing_query)
        if existing_result.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Role with this name already exists"
            )

    for field, value in update_data.items():
        setattr(role, field, value)

    await db.commit()
    await db.refresh(role)

    # Convert role to dict and handle None values for is_active
    role_dict = {
        'id': role.id,
        'tenant_id': role.tenant_id,
        'role_name': role.role_name,
        'display_name': role.display_name,
        'description': role.description,
        'permissions': role.permissions,
        'is_active': role.is_active if role.is_active is not None else True,  # Handle None values
        'is_system_role': role.is_system_role if role.is_system_role is not None else False,
        'created_at': role.created_at,
        'updated_at': role.updated_at,
        'employees': [],  # Don't load full employee objects to avoid recursion
        'invitations': []  # Don't load full invitation objects to avoid recursion
    }

    return CompanyRoleSchema.model_validate(role_dict)


@router.delete("/{role_id}", status_code=204)
async def delete_role(
    role_id: str,
    token_data: TokenData = Depends(require_permissions([*ROLE_DELETE])),
    tenant_id: str = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a role

    Requires: ROLE_DELETE permission
    """

    # Get existing role
    query = select(CompanyRole).where(
        CompanyRole.id == role_id,
        CompanyRole.tenant_id == tenant_id
    )
    result = await db.execute(query)
    role = result.scalar_one_or_none()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Prevent deleting system roles
    if role.is_system_role:
        raise HTTPException(
            status_code=403,
            detail="Cannot delete system roles"
        )

    # Check if role has employees
    employee_query = select(func.count()).select_from(EmployeeProfile).where(
        EmployeeProfile.role_id == role_id,
        EmployeeProfile.tenant_id == tenant_id
    )
    employee_result = await db.execute(employee_query)
    employee_count = employee_result.scalar() or 0

    if employee_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete role with {employee_count} assigned employees"
        )

    # Delete role
    await db.delete(role)
    await db.commit()


@router.get("/{role_id}/permissions")
async def get_role_permissions(
    role_id: str,
    token_data: TokenData = Depends(require_permissions([*ROLE_READ])),
    tenant_id: str = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get permissions for a specific role

    Requires: ROLE_READ permission
    """

    # Get role
    query = select(CompanyRole).where(
        CompanyRole.id == role_id,
        CompanyRole.tenant_id == tenant_id
    )
    result = await db.execute(query)
    role = result.scalar_one_or_none()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Return permissions
    return {
        "role_id": role_id,
        "role_name": role.role_name,
        "display_name": role.display_name,
        "permissions": role.permissions or {},
        "is_system_role": role.is_system_role
    }


@router.put("/{role_id}/permissions")
async def update_role_permissions(
    role_id: str,
    permissions: dict,
    token_data: TokenData = Depends(require_permissions([*ROLE_ASSIGN])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Update permissions for a specific role

    Requires: ROLE_ASSIGN permission
    """

    # Get role
    query = select(CompanyRole).where(
        CompanyRole.id == role_id,
        CompanyRole.tenant_id == tenant_id
    )
    result = await db.execute(query)
    role = result.scalar_one_or_none()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Prevent updating system roles
    if role.is_system_role:
        raise HTTPException(
            status_code=403,
            detail="Cannot update system role permissions"
        )

    # Update permissions
    role.permissions = permissions
    await db.commit()
    await db.refresh(role)

    return {
        "role_id": role_id,
        "role_name": role.role_name,
        "display_name": role.display_name,
        "permissions": role.permissions,
        "message": "Permissions updated successfully"
    }


@router.get("/default/permissions")
async def get_default_permissions():
    """
    Get default permission template for creating new roles
    """
    return {
        "modules": {
            "users": {
                "view": False,
                "create": False,
                "update": False,
                "delete": False,
                "invite": False,
                "activate": False
            },
            "roles": {
                "view": False,
                "create": False,
                "update": False,
                "delete": False,
                "manage_permissions": False
            },
            "branches": {
                "view": False,
                "create": False,
                "update": False,
                "delete": False,
                "manage": False
            },
            "customers": {
                "view": False,
                "create": False,
                "update": False,
                "delete": False
            },
            "vehicles": {
                "view": False,
                "create": False,
                "update": False,
                "delete": False,
                "assign": False
            },
            "products": {
                "view": False,
                "create": False,
                "update": False,
                "delete": False
            },
            "bookings": {
                "view": False,
                "create": False,
                "update": False,
                "delete": False,
                "cancel": False,
                "approve": False
            },
            "drivers": {
                "view": False,
                "create": False,
                "update": False,
                "delete": False,
                "assign": False,
                "manage_profile": False
            },
            "reports": {
                "view": False,
                "export": False,
                "financial": False,
                "operational": False,
                "analytics": False
            },
            "finance": {
                "view": False,
                "create": False,
                "update": False,
                "delete": False,
                "approve": False,
                "process_payments": False
            },
            "inventory": {
                "view": False,
                "create": False,
                "update": False,
                "delete": False,
                "adjust": False
            }
        },
        "system": {
            "settings": False,
            "audit_logs": False,
            "system_health": False
        }
    }


@router.post("/seed", status_code=201)
async def seed_default_roles(
    token_data: TokenData = Depends(require_permissions([*ROLE_CREATE])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Seed default system roles for a new tenant

    Requires: ROLE_CREATE permission
    """

    # Define default roles
    default_roles = [
        {
            "role_name": "super_admin",
            "display_name": "Super Administrator",
            "description": "Full system access with all permissions",
            "is_system_role": True
        },
        {
            "role_name": "admin",
            "display_name": "Administrator",
            "description": "Administrative access with limited system permissions",
            "is_system_role": True
        },
        {
            "role_name": "branch_manager",
            "display_name": "Branch Manager",
            "description": "Manages branch operations, staff, and customer relations",
            "is_system_role": True
        },
        {
            "role_name": "logistics_manager",
            "display_name": "Logistics Manager",
            "description": "Manages vehicle fleet, drivers, and delivery operations",
            "is_system_role": True
        },
        {
            "role_name": "finance_manager",
            "display_name": "Finance Manager",
            "description": "Manages financial operations, billing, and payments",
            "is_system_role": True
        },
        {
            "role_name": "driver",
            "display_name": "Driver",
            "description": "Delivery driver with access to trip management",
            "is_system_role": True
        },
        {
            "role_name": "customer_service",
            "display_name": "Customer Service Representative",
            "description": "Handles customer inquiries, bookings, and support",
            "is_system_role": True
        },
        {
            "role_name": "operator",
            "display_name": "Operator",
            "description": "Processes bookings and coordinates operations",
            "is_system_role": True
        }
    ]

    created_roles = []

    for role_data in default_roles:
        # Check if role already exists
        existing_query = select(CompanyRole).where(
            CompanyRole.role_name == role_data["role_name"],
            CompanyRole.tenant_id == tenant_id
        )
        existing_result = await db.execute(existing_query)
        if existing_result.scalar_one_or_none():
            continue  # Skip if already exists

        # Create role
        role = CompanyRole(
            tenant_id=tenant_id,
            **role_data
        )

        db.add(role)
        created_roles.append(role_data["display_name"])

    if created_roles:
        await db.commit()
        logger.info(f"Created default roles for tenant {tenant_id}: {', '.join(created_roles)}")
    else:
        logger.info(f"Default roles already exist for tenant {tenant_id}")

    return {
        "message": f"Seeded {len(created_roles)} default roles",
        "created_roles": created_roles
    }
