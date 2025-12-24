"""
User management endpoints
"""
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import secrets
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.database import AsyncSessionLocal, EmployeeProfile, UserInvitation, CompanyRole, Branch
from src.helpers import validate_branch_exists, validate_role_exists, validate_employee_reporting_hierarchy, validate_employee_exists
from src.schemas import (
    EmployeeProfile as EmployeeProfileSchema,
    EmployeeProfileCreate,
    EmployeeProfileUpdate,
    UserInvitation as UserInvitationSchema,
    UserInvitationCreate,
    UserInvitationUpdate,
    PaginatedResponse,
    UserManagementResponse
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


# Helper function to get tenant_id from request (mock for now)
async def get_current_tenant_id() -> str:
    """
    Get current tenant ID from authentication token
    TODO: Implement proper authentication integration
    """
    # Mock implementation - in production, this will extract from JWT token
    return "default-tenant"


# Helper function to get current user ID (mock for now)
async def get_current_user_id() -> str:
    """
    Get current user ID from authentication token
    TODO: Implement proper authentication integration
    """
    # Mock implementation - in production, this will extract from JWT token
    return "mock-user-id"


@router.get("/", response_model=PaginatedResponse)
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role_id: Optional[str] = Query(None),
    branch_id: Optional[uuid.UUID] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    List all users for the current tenant
    """
    tenant_id = await get_current_tenant_id()

    # Build query
    query = select(EmployeeProfile).where(EmployeeProfile.tenant_id == tenant_id)

    # Apply filters
    if search:
        query = query.where(
            or_(
                EmployeeProfile.first_name.ilike(f"%{search}%"),
                EmployeeProfile.last_name.ilike(f"%{search}%"),
                EmployeeProfile.email.ilike(f"%{search}%"),
                EmployeeProfile.employee_code.ilike(f"%{search}%")
            )
        )

    if role_id:
        query = query.where(EmployeeProfile.role_id == role_id)

    if branch_id:
        query = query.where(EmployeeProfile.branch_id == branch_id)

    if is_active is not None:
        query = query.where(EmployeeProfile.is_active == is_active)

    # Count total items
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page).order_by(EmployeeProfile.created_at.desc())

    # Execute query without relationships to avoid recursion
    result = await db.execute(query)
    users = result.scalars().all()

    # Calculate pages
    pages = (total + per_page - 1) // per_page

    # Process each user to get relationship data
    processed_users = []
    for user in users:
        # Get role data separately
        role_data = None
        if user.role_id:
            role_query = select(CompanyRole).where(CompanyRole.id == user.role_id)
            role_result = await db.execute(role_query)
            role_obj = role_result.scalar_one_or_none()

            if role_obj:
                role_data = {
                    'id': role_obj.id,
                    'tenant_id': role_obj.tenant_id,
                    'role_name': role_obj.role_name,
                    'display_name': role_obj.display_name,
                    'name': role_obj.display_name,
                    'description': role_obj.description,
                    'permissions': role_obj.permissions,
                    'is_active': role_obj.is_active if role_obj.is_active is not None else True,
                    'is_system_role': role_obj.is_system_role if role_obj.is_system_role is not None else False,
                    'created_at': role_obj.created_at,
                    'updated_at': role_obj.updated_at,
                    'employees': [],  # Empty to avoid recursion
                    'invitations': []  # Empty to avoid recursion
                }

        # Get branch data separately
        branch_data = None
        if user.branch_id:
            branch_query = select(Branch).where(Branch.id == user.branch_id)
            branch_result = await db.execute(branch_query)
            branch_obj = branch_result.scalar_one_or_none()

            if branch_obj:
                branch_data = {
                    'id': branch_obj.id,
                    'tenant_id': branch_obj.tenant_id,
                    'code': branch_obj.code,
                    'name': branch_obj.name,
                    'address': branch_obj.address,
                    'city': branch_obj.city,
                    'state': branch_obj.state,
                    'postal_code': branch_obj.postal_code,
                    'phone': branch_obj.phone,
                    'email': branch_obj.email,
                    'manager_id': branch_obj.manager_id,
                    'is_active': branch_obj.is_active if branch_obj.is_active is not None else True,
                    'created_at': branch_obj.created_at,
                    'updated_at': branch_obj.updated_at
                }

        # Convert user to dict and add relationships
        user_dict = {
            'id': user.id,
            'tenant_id': user.tenant_id,
            'user_id': user.user_id,
            'employee_code': user.employee_code,
            'role_id': user.role_id,
            'branch_id': user.branch_id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'email': user.email,
            'date_of_birth': user.date_of_birth,
            'gender': user.gender,
            'blood_group': user.blood_group,
            'emergency_contact_name': user.emergency_contact_name,
            'emergency_contact_phone': user.emergency_contact_phone,
            'address': user.address,
            'city': user.city,
            'state': user.state,
            'postal_code': user.postal_code,
            'country': user.country,
            'hire_date': user.hire_date,
            'employment_type': user.employment_type,
            'department': user.department,
            'designation': user.designation,
            'reports_to': user.reports_to,
            'salary': user.salary,
            'bank_account_number': user.bank_account_number,
            'bank_name': user.bank_name,
            'bank_ifsc': user.bank_ifsc,
            'pan_number': user.pan_number,
            'aadhaar_number': user.aadhar_number,
            'is_active': user.is_active,
            'created_at': user.created_at,
            'updated_at': user.updated_at,
            'role': role_data,
            'branch': branch_data,
            'documents': []  # Empty for now
        }

        processed_users.append(EmployeeProfileSchema.model_validate(user_dict))

    return PaginatedResponse(
        items=processed_users,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/{user_id}", response_model=EmployeeProfileSchema)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific user by ID
    """
    tenant_id = await get_current_tenant_id()

    # Debug logging
    logger.info(f"Looking for user_id: {user_id} with tenant_id: {tenant_id}")

    # Get user without loading problematic relationships
    query = select(EmployeeProfile).where(
        EmployeeProfile.id == user_id,
        EmployeeProfile.tenant_id == tenant_id
    )

    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        logger.warning(f"User not found for user_id: {user_id}")

        # Check if any user exists with this ID (regardless of tenant)
        all_tenant_query = select(EmployeeProfile).where(EmployeeProfile.id == user_id)
        all_tenant_result = await db.execute(all_tenant_query)
        all_tenant_user = all_tenant_result.scalar_one_or_none()

        if all_tenant_user:
            logger.error(f"User found but with different tenant_id. Expected: {tenant_id}, Actual: {all_tenant_user.tenant_id}")
        else:
            logger.error(f"No user found with ID {user_id} in any tenant")

        raise HTTPException(status_code=404, detail="User not found")

    # Get role data separately without loading relationships to avoid recursion
    role_data = None
    if user.role_id:
        role_query = select(CompanyRole).where(CompanyRole.id == user.role_id)
        role_result = await db.execute(role_query)
        role_obj = role_result.scalar_one_or_none()

        if role_obj:
            role_data = {
                'id': role_obj.id,
                'tenant_id': role_obj.tenant_id,
                'role_name': role_obj.role_name,
                'display_name': role_obj.display_name,
                'name': role_obj.display_name,
                'description': role_obj.description,
                'permissions': role_obj.permissions,
                'is_active': role_obj.is_active if role_obj.is_active is not None else True,
                'is_system_role': role_obj.is_system_role if role_obj.is_system_role is not None else False,
                'created_at': role_obj.created_at,
                'updated_at': role_obj.updated_at,
                'employees': [],  # Empty to avoid recursion
                'invitations': []  # Empty to avoid recursion
            }

    # Get branch data separately
    branch_data = None
    if user.branch_id:
        branch_query = select(Branch).where(Branch.id == user.branch_id)
        branch_result = await db.execute(branch_query)
        branch_obj = branch_result.scalar_one_or_none()

        if branch_obj:
            branch_data = {
                'id': branch_obj.id,
                'tenant_id': branch_obj.tenant_id,
                'code': branch_obj.code,
                'name': branch_obj.name,
                'address': branch_obj.address,
                'city': branch_obj.city,
                'state': branch_obj.state,
                'postal_code': branch_obj.postal_code,
                'phone': branch_obj.phone,
                'email': branch_obj.email,
                'manager_id': branch_obj.manager_id,
                'is_active': branch_obj.is_active if branch_obj.is_active is not None else True,
                'created_at': branch_obj.created_at,
                'updated_at': branch_obj.updated_at
            }

    # Convert user to dict and add relationships
    user_dict = {
        'id': user.id,
        'tenant_id': user.tenant_id,
        'user_id': user.user_id,
        'employee_code': user.employee_code,
        'role_id': user.role_id,
        'branch_id': user.branch_id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'phone': user.phone,
        'email': user.email,
        'date_of_birth': user.date_of_birth,
        'gender': user.gender,
        'blood_group': user.blood_group,
        'emergency_contact_name': user.emergency_contact_name,
        'emergency_contact_phone': user.emergency_contact_phone,
        'address': user.address,
        'city': user.city,
        'state': user.state,
        'postal_code': user.postal_code,
        'country': user.country,
        'hire_date': user.hire_date,
        'employment_type': user.employment_type,
        'department': user.department,
        'designation': user.designation,
        'reports_to': user.reports_to,
        'salary': user.salary,
        'bank_account_number': user.bank_account_number,
        'bank_name': user.bank_name,
        'bank_ifsc': user.bank_ifsc,
        'pan_number': user.pan_number,
        'aadhaar_number': user.aadhar_number,
        'is_active': user.is_active,
        'created_at': user.created_at,
        'updated_at': user.updated_at,
        'role': role_data,
        'branch': branch_data,
        'documents': []  # Empty for now
    }

    return EmployeeProfileSchema.model_validate(user_dict)


@router.post("/", response_model=EmployeeProfileSchema, status_code=201)
async def create_user(
    user_data: EmployeeProfileCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user
    """
    tenant_id = await get_current_tenant_id()

    # Check if employee code already exists
    if user_data.employee_code:
        existing_query = select(EmployeeProfile).where(
            EmployeeProfile.employee_code == user_data.employee_code,
            EmployeeProfile.tenant_id == tenant_id
        )
        existing_result = await db.execute(existing_query)
        if existing_result.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Employee with this code already exists"
            )

    # Check if user_id already exists
    existing_user_query = select(EmployeeProfile).where(
        EmployeeProfile.user_id == user_data.user_id,
        EmployeeProfile.tenant_id == tenant_id
    )
    existing_user_result = await db.execute(existing_user_query)
    if existing_user_result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="User profile already exists for this user ID"
        )

    # Verify role exists
    try:
        role = await validate_role_exists(db, user_data.role_id, tenant_id)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    # Verify branch exists if provided
    if user_data.branch_id:
        try:
            await validate_branch_exists(db, user_data.branch_id, tenant_id)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )

    # Validate reporting hierarchy if reports_to is provided
    if user_data.reports_to:
        try:
            # Note: We don't have the employee_id yet since it's not created
            # This validation will be more useful in update operations
            await validate_employee_exists(db, user_data.reports_to, tenant_id)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid manager ID: {str(e)}"
            )

    # Create new user
    user = EmployeeProfile(
        tenant_id=tenant_id,
        **user_data.model_dump()
    )

    db.add(user)
    await db.commit()

    # Load relationships for response
    await db.refresh(user)

    # Get the user with minimal relationship loading to avoid recursion
    query = select(EmployeeProfile).where(
        EmployeeProfile.id == user.id
    )

    # Don't load the full role object to avoid recursion, get role data separately
    result = await db.execute(query)
    user = result.scalar_one()

    # Get role data separately without loading relationships
    role_data = None
    if user.role_id:
        role_query = select(CompanyRole).where(CompanyRole.id == user.role_id)
        role_result = await db.execute(role_query)
        role_obj = role_result.scalar_one_or_none()

        if role_obj:
            role_data = {
                'id': role_obj.id,
                'tenant_id': role_obj.tenant_id,
                'role_name': role_obj.role_name,
                'display_name': role_obj.display_name,
                'name': role_obj.display_name,  # Add name field for compatibility
                'description': role_obj.description,
                'permissions': role_obj.permissions,
                'is_active': role_obj.is_active if role_obj.is_active is not None else True,
                'is_system_role': role_obj.is_system_role if role_obj.is_system_role is not None else False,
                'created_at': role_obj.created_at,
                'updated_at': role_obj.updated_at,
                'employees': [],  # Empty to avoid recursion
                'invitations': []  # Empty to avoid recursion
            }

    # Get branch data separately
    branch_data = None
    if user.branch_id:
        branch_query = select(Branch).where(Branch.id == user.branch_id)
        branch_result = await db.execute(branch_query)
        branch_obj = branch_result.scalar_one_or_none()

        if branch_obj:
            branch_data = {
                'id': branch_obj.id,
                'tenant_id': branch_obj.tenant_id,
                'code': branch_obj.code,
                'name': branch_obj.name,
                'address': branch_obj.address,
                'city': branch_obj.city,
                'state': branch_obj.state,
                'postal_code': branch_obj.postal_code,
                'phone': branch_obj.phone,
                'email': branch_obj.email,
                'manager_id': branch_obj.manager_id,
                'is_active': branch_obj.is_active if branch_obj.is_active is not None else True,
                'created_at': branch_obj.created_at,
                'updated_at': branch_obj.updated_at
            }

    # Convert user to dict and add relationships
    user_dict = {
        'id': user.id,
        'tenant_id': user.tenant_id,
        'user_id': user.user_id,
        'employee_code': user.employee_code,
        'role_id': user.role_id,
        'branch_id': user.branch_id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'phone': user.phone,
        'email': user.email,
        'date_of_birth': user.date_of_birth,
        'gender': user.gender,
        'blood_group': user.blood_group,
        'emergency_contact_name': user.emergency_contact_name,
        'emergency_contact_phone': user.emergency_contact_phone,
        'address': user.address,
        'city': user.city,
        'state': user.state,
        'postal_code': user.postal_code,
        'country': user.country,
        'hire_date': user.hire_date,
        'employment_type': user.employment_type,
        'department': user.department,
        'designation': user.designation,
        'reports_to': user.reports_to,
        'salary': user.salary,
        'bank_account_number': user.bank_account_number,
        'bank_name': user.bank_name,
        'bank_ifsc': user.bank_ifsc,
        'pan_number': user.pan_number,
        'aadhaar_number': user.aadhar_number,
        'is_active': user.is_active,
        'created_at': user.created_at,
        'updated_at': user.updated_at,
        'role': role_data,
        'branch': branch_data,
        'documents': []  # Empty for now
    }

    return EmployeeProfileSchema.model_validate(user_dict)


@router.put("/{user_id}", response_model=EmployeeProfileSchema)
async def update_user(
    user_id: str,
    user_data: EmployeeProfileUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user
    """
    tenant_id = await get_current_tenant_id()

    # Get existing user
    query = select(EmployeeProfile).where(
        EmployeeProfile.id == user_id,
        EmployeeProfile.tenant_id == tenant_id
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update user
    update_data = user_data.model_dump(exclude_unset=True)

    # Verify role if updating
    if "role_id" in update_data:
        try:
            await validate_role_exists(db, update_data["role_id"], tenant_id)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )

    # Verify branch if updating
    if "branch_id" in update_data and update_data["branch_id"]:
        try:
            await validate_branch_exists(db, update_data["branch_id"], tenant_id)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )

    # Validate reporting hierarchy if updating reports_to
    if "reports_to" in update_data and update_data["reports_to"]:
        try:
            await validate_employee_reporting_hierarchy(
                db, user_id, update_data["reports_to"], tenant_id
            )
            # Also verify the manager exists
            await validate_employee_exists(db, update_data["reports_to"], tenant_id)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )

    # Check employee code uniqueness if updating
    if "employee_code" in update_data and update_data["employee_code"]:
        existing_query = select(EmployeeProfile).where(
            EmployeeProfile.employee_code == update_data["employee_code"],
            EmployeeProfile.tenant_id == tenant_id,
            EmployeeProfile.id != user_id
        )
        existing_result = await db.execute(existing_query)
        if existing_result.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Employee with this code already exists"
            )

    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    # Get role data separately without loading relationships to avoid recursion
    role_data = None
    if user.role_id:
        role_query = select(CompanyRole).where(CompanyRole.id == user.role_id)
        role_result = await db.execute(role_query)
        role_obj = role_result.scalar_one_or_none()

        if role_obj:
            role_data = {
                'id': role_obj.id,
                'tenant_id': role_obj.tenant_id,
                'role_name': role_obj.role_name,
                'display_name': role_obj.display_name,
                'name': role_obj.display_name,
                'description': role_obj.description,
                'permissions': role_obj.permissions,
                'is_active': role_obj.is_active if role_obj.is_active is not None else True,
                'is_system_role': role_obj.is_system_role if role_obj.is_system_role is not None else False,
                'created_at': role_obj.created_at,
                'updated_at': role_obj.updated_at,
                'employees': [],  # Empty to avoid recursion
                'invitations': []  # Empty to avoid recursion
            }

    # Get branch data separately
    branch_data = None
    if user.branch_id:
        branch_query = select(Branch).where(Branch.id == user.branch_id)
        branch_result = await db.execute(branch_query)
        branch_obj = branch_result.scalar_one_or_none()

        if branch_obj:
            branch_data = {
                'id': branch_obj.id,
                'tenant_id': branch_obj.tenant_id,
                'code': branch_obj.code,
                'name': branch_obj.name,
                'address': branch_obj.address,
                'city': branch_obj.city,
                'state': branch_obj.state,
                'postal_code': branch_obj.postal_code,
                'phone': branch_obj.phone,
                'email': branch_obj.email,
                'manager_id': branch_obj.manager_id,
                'is_active': branch_obj.is_active if branch_obj.is_active is not None else True,
                'created_at': branch_obj.created_at,
                'updated_at': branch_obj.updated_at
            }

    # Convert user to dict and add relationships
    user_dict = {
        'id': user.id,
        'tenant_id': user.tenant_id,
        'user_id': user.user_id,
        'employee_code': user.employee_code,
        'role_id': user.role_id,
        'branch_id': user.branch_id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'phone': user.phone,
        'email': user.email,
        'date_of_birth': user.date_of_birth,
        'gender': user.gender,
        'blood_group': user.blood_group,
        'emergency_contact_name': user.emergency_contact_name,
        'emergency_contact_phone': user.emergency_contact_phone,
        'address': user.address,
        'city': user.city,
        'state': user.state,
        'postal_code': user.postal_code,
        'country': user.country,
        'hire_date': user.hire_date,
        'employment_type': user.employment_type,
        'department': user.department,
        'designation': user.designation,
        'reports_to': user.reports_to,
        'salary': user.salary,
        'bank_account_number': user.bank_account_number,
        'bank_name': user.bank_name,
        'bank_ifsc': user.bank_ifsc,
        'pan_number': user.pan_number,
        'aadhaar_number': user.aadhar_number,
        'is_active': user.is_active,
        'created_at': user.created_at,
        'updated_at': user.updated_at,
        'role': role_data,
        'branch': branch_data,
        'documents': []  # Empty for now
    }

    return EmployeeProfileSchema.model_validate(user_dict)


@router.post("/invite", response_model=UserInvitationSchema, status_code=201)
async def invite_user(
    invitation_data: UserInvitationCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Send user invitation
    """
    tenant_id = await get_current_tenant_id()
    current_user_id = await get_current_user_id()

    # Check if there's already a pending invitation for this email
    existing_query = select(UserInvitation).where(
        UserInvitation.email == invitation_data.email,
        UserInvitation.tenant_id == tenant_id,
        UserInvitation.status == "pending"
    )
    existing_result = await db.execute(existing_query)
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Pending invitation already exists for this email"
        )

    # Verify role exists
    try:
        await validate_role_exists(db, invitation_data.role_id, tenant_id)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    # Verify branch exists if provided
    if invitation_data.branch_id:
        try:
            await validate_branch_exists(db, invitation_data.branch_id, tenant_id)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )

    # Create invitation
    invitation = UserInvitation(
        tenant_id=tenant_id,
        invitation_token=secrets.token_urlsafe(32),
        invited_by=current_user_id,
        **invitation_data.model_dump(exclude={"invitation_token", "invited_at"})
    )

    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    # TODO: Send invitation email
    logger.info(f"User invitation sent to {invitation_data.email} with token {invitation.invitation_token}")

    # Get role data separately without loading relationships
    role_data = None
    if invitation.role_id:
        role_query = select(CompanyRole).where(CompanyRole.id == invitation.role_id)
        role_result = await db.execute(role_query)
        role_obj = role_result.scalar_one_or_none()

        if role_obj:
            role_data = {
                'id': role_obj.id,
                'tenant_id': role_obj.tenant_id,
                'role_name': role_obj.role_name,
                'display_name': role_obj.display_name,
                'description': role_obj.description,
                'permissions': role_obj.permissions,
                'is_active': role_obj.is_active if role_obj.is_active is not None else True,
                'is_system_role': role_obj.is_system_role if role_obj.is_system_role is not None else False,
                'created_at': role_obj.created_at,
                'updated_at': role_obj.updated_at,
                'employees': [],  # Empty to avoid recursion
                'invitations': []  # Empty to avoid recursion
            }

    # Get branch data separately
    branch_data = None
    if invitation.branch_id:
        branch_query = select(Branch).where(Branch.id == invitation.branch_id)
        branch_result = await db.execute(branch_query)
        branch_obj = branch_result.scalar_one_or_none()

        if branch_obj:
            branch_data = {
                'id': branch_obj.id,
                'tenant_id': branch_obj.tenant_id,
                'code': branch_obj.code,
                'name': branch_obj.name,
                'address': branch_obj.address,
                'city': branch_obj.city,
                'state': branch_obj.state,
                'postal_code': branch_obj.postal_code,
                'phone': branch_obj.phone,
                'email': branch_obj.email,
                'manager_id': branch_obj.manager_id,
                'is_active': branch_obj.is_active if branch_obj.is_active is not None else True,
                'created_at': branch_obj.created_at,
                'updated_at': branch_obj.updated_at
            }

    # Convert invitation to dict and add relationships
    invitation_dict = {
        'id': invitation.id,
        'tenant_id': invitation.tenant_id,
        'email': invitation.email,
        'invitation_token': invitation.invitation_token,
        'role_id': invitation.role_id,
        'branch_id': invitation.branch_id,
        'invited_by': invitation.invited_by,
        'invited_at': invitation.invited_at,
        'expires_at': invitation.expires_at,
        'accepted_at': invitation.accepted_at,
        'accepted_by': invitation.accepted_by,
        'status': invitation.status,
        'is_active': invitation.is_active,
        'created_at': invitation.created_at,
        'updated_at': invitation.updated_at,
        'role': role_data,
        'branch': branch_data
    }

    return UserInvitationSchema.model_validate(invitation_dict)


@router.post("/{user_id}/activate", response_model=UserManagementResponse)
async def activate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Activate a user
    """
    tenant_id = await get_current_tenant_id()

    # Get user
    query = select(EmployeeProfile).where(
        EmployeeProfile.id == user_id,
        EmployeeProfile.tenant_id == tenant_id
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Activate user
    user.is_active = True
    await db.commit()

    return UserManagementResponse(
        user_id=user.user_id,
        employee_id=user_id,
        status="activated",
        message="User activated successfully"
    )


@router.post("/{user_id}/deactivate", response_model=UserManagementResponse)
async def deactivate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Deactivate a user
    """
    tenant_id = await get_current_tenant_id()

    # Get user
    query = select(EmployeeProfile).where(
        EmployeeProfile.id == user_id,
        EmployeeProfile.tenant_id == tenant_id
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Deactivate user
    user.is_active = False
    await db.commit()

    return UserManagementResponse(
        user_id=user.user_id,
        employee_id=user_id,
        status="deactivated",
        message="User deactivated successfully"
    )


@router.get("/invitations/", response_model=PaginatedResponse)
async def list_invitations(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    List all user invitations for the current tenant
    """
    tenant_id = await get_current_tenant_id()

    # Build query
    query = select(UserInvitation).where(UserInvitation.tenant_id == tenant_id)

    # Apply filters
    if status:
        query = query.where(UserInvitation.status == status)

    # Count total items
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page).order_by(UserInvitation.invited_at.desc())

    # Execute query without relationships to avoid recursion
    result = await db.execute(query)
    invitations = result.scalars().all()

    # Calculate pages
    pages = (total + per_page - 1) // per_page

    # Process each invitation to get relationship data
    processed_invitations = []
    for invitation in invitations:
        # Get role data separately
        role_data = None
        if invitation.role_id:
            role_query = select(CompanyRole).where(CompanyRole.id == invitation.role_id)
            role_result = await db.execute(role_query)
            role_obj = role_result.scalar_one_or_none()

            if role_obj:
                role_data = {
                    'id': role_obj.id,
                    'tenant_id': role_obj.tenant_id,
                    'role_name': role_obj.role_name,
                    'display_name': role_obj.display_name,
                    'description': role_obj.description,
                    'permissions': role_obj.permissions,
                    'is_active': role_obj.is_active if role_obj.is_active is not None else True,
                    'is_system_role': role_obj.is_system_role if role_obj.is_system_role is not None else False,
                    'created_at': role_obj.created_at,
                    'updated_at': role_obj.updated_at,
                    'employees': [],  # Empty to avoid recursion
                    'invitations': []  # Empty to avoid recursion
                }

        # Get branch data separately
        branch_data = None
        if invitation.branch_id:
            branch_query = select(Branch).where(Branch.id == invitation.branch_id)
            branch_result = await db.execute(branch_query)
            branch_obj = branch_result.scalar_one_or_none()

            if branch_obj:
                branch_data = {
                    'id': branch_obj.id,
                    'tenant_id': branch_obj.tenant_id,
                    'code': branch_obj.code,
                    'name': branch_obj.name,
                    'address': branch_obj.address,
                    'city': branch_obj.city,
                    'state': branch_obj.state,
                    'postal_code': branch_obj.postal_code,
                    'phone': branch_obj.phone,
                    'email': branch_obj.email,
                    'manager_id': branch_obj.manager_id,
                    'is_active': branch_obj.is_active if branch_obj.is_active is not None else True,
                    'created_at': branch_obj.created_at,
                    'updated_at': branch_obj.updated_at
                }

        # Convert invitation to dict and add relationships
        invitation_dict = {
            'id': invitation.id,
            'tenant_id': invitation.tenant_id,
            'email': invitation.email,
            'invitation_token': invitation.invitation_token,
            'role_id': invitation.role_id,
            'branch_id': invitation.branch_id,
            'invited_by': invitation.invited_by,
            'invited_at': invitation.invited_at,
            'expires_at': invitation.expires_at,
            'accepted_at': invitation.accepted_at,
            'accepted_by': invitation.accepted_by,
            'status': invitation.status,
            'is_active': invitation.is_active,
            'created_at': invitation.created_at,
            'updated_at': invitation.updated_at,
            'role': role_data,
            'branch': branch_data
        }

        processed_invitations.append(UserInvitationSchema.model_validate(invitation_dict))

    return PaginatedResponse(
        items=processed_invitations,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.put("/invitations/{invitation_id}", response_model=UserInvitationSchema)
async def update_invitation(
    invitation_id: str,
    invitation_data: UserInvitationUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user invitation
    """
    tenant_id = await get_current_tenant_id()

    # Get existing invitation
    query = select(UserInvitation).where(
        UserInvitation.id == invitation_id,
        UserInvitation.tenant_id == tenant_id
    )
    result = await db.execute(query)
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    # Update invitation
    update_data = invitation_data.model_dump(exclude_unset=True)

    # Verify role if updating
    if "role_id" in update_data:
        try:
            await validate_role_exists(db, update_data["role_id"], tenant_id)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )

    # Verify branch if updating
    if "branch_id" in update_data and update_data["branch_id"]:
        try:
            await validate_branch_exists(db, update_data["branch_id"], tenant_id)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )

    for field, value in update_data.items():
        setattr(invitation, field, value)

    await db.commit()
    await db.refresh(invitation)

    # Get role data separately without loading relationships
    role_data = None
    if invitation.role_id:
        role_query = select(CompanyRole).where(CompanyRole.id == invitation.role_id)
        role_result = await db.execute(role_query)
        role_obj = role_result.scalar_one_or_none()

        if role_obj:
            role_data = {
                'id': role_obj.id,
                'tenant_id': role_obj.tenant_id,
                'role_name': role_obj.role_name,
                'display_name': role_obj.display_name,
                'description': role_obj.description,
                'permissions': role_obj.permissions,
                'is_active': role_obj.is_active if role_obj.is_active is not None else True,
                'is_system_role': role_obj.is_system_role if role_obj.is_system_role is not None else False,
                'created_at': role_obj.created_at,
                'updated_at': role_obj.updated_at,
                'employees': [],  # Empty to avoid recursion
                'invitations': []  # Empty to avoid recursion
            }

    # Get branch data separately
    branch_data = None
    if invitation.branch_id:
        branch_query = select(Branch).where(Branch.id == invitation.branch_id)
        branch_result = await db.execute(branch_query)
        branch_obj = branch_result.scalar_one_or_none()

        if branch_obj:
            branch_data = {
                'id': branch_obj.id,
                'tenant_id': branch_obj.tenant_id,
                'code': branch_obj.code,
                'name': branch_obj.name,
                'address': branch_obj.address,
                'city': branch_obj.city,
                'state': branch_obj.state,
                'postal_code': branch_obj.postal_code,
                'phone': branch_obj.phone,
                'email': branch_obj.email,
                'manager_id': branch_obj.manager_id,
                'is_active': branch_obj.is_active if branch_obj.is_active is not None else True,
                'created_at': branch_obj.created_at,
                'updated_at': branch_obj.updated_at
            }

    # Convert invitation to dict and add relationships
    invitation_dict = {
        'id': invitation.id,
        'tenant_id': invitation.tenant_id,
        'email': invitation.email,
        'invitation_token': invitation.invitation_token,
        'role_id': invitation.role_id,
        'branch_id': invitation.branch_id,
        'invited_by': invitation.invited_by,
        'invited_at': invitation.invited_at,
        'expires_at': invitation.expires_at,
        'accepted_at': invitation.accepted_at,
        'accepted_by': invitation.accepted_by,
        'status': invitation.status,
        'is_active': invitation.is_active,
        'created_at': invitation.created_at,
        'updated_at': invitation.updated_at,
        'role': role_data,
        'branch': branch_data
    }

    return UserInvitationSchema.model_validate(invitation_dict)