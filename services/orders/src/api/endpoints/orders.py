"""
Orders API endpoints
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, asc, func

from src.database import get_db
from src.models.order import Order, OrderStatus
from src.schemas import (
    OrderCreate,
    OrderUpdate,
    OrderResponse,
    OrderListResponse,
    OrderStatusUpdate,
    FinanceApprovalRequest,
    LogisticsApprovalRequest,
    OrderQueryParams,
    PaginatedResponse,
    OrderStatusHistoryResponse,
)
from src.security import (
    TokenData,
    require_permissions,
    require_any_permission,
    get_current_user_id,
    get_current_tenant_id,
)
import logging
from src.services.order_service import OrderService
logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=PaginatedResponse[OrderListResponse])
async def list_orders(
    status: Optional[OrderStatus] = Query(
        None, description="Filter by order status"),
    customer_id: Optional[UUID] = Query(
        None, description="Filter by customer ID"),
    branch_id: Optional[UUID] = Query(None, description="Filter by branch ID"),
    order_type: Optional[str] = Query(
        None, description="Filter by order type"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    payment_type: Optional[str] = Query(
        None, description="Filter by payment type"),
    date_from: Optional[datetime] = Query(
        None, description="Filter by date from"),
    date_to: Optional[datetime] = Query(None, description="Filter by date to"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    sort_by: str = Query(
        "created_at", regex="^(created_at|updated_at|order_number|total_amount)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(
        require_any_permission(["orders:read_all", "orders:read"])),
    tenant_id: str = Depends(get_current_tenant_id),
):
    """List orders with filtering and pagination"""
    order_service = OrderService(db)

    # Build filters
    filters = [Order.tenant_id == tenant_id, Order.is_active == True]

    if status:
        filters.append(Order.status == status)
    if customer_id:
        filters.append(Order.customer_id == customer_id)
    if branch_id:
        filters.append(Order.branch_id == branch_id)
    if order_type:
        filters.append(Order.order_type == order_type)
    if priority:
        filters.append(Order.priority == priority)
    if payment_type:
        filters.append(Order.payment_type == payment_type)
    if date_from:
        filters.append(Order.created_at >= date_from)
    if date_to:
        filters.append(Order.created_at <= date_to)

    # Build sort order
    sort_column = getattr(Order, sort_by)
    if sort_order == "desc":
        order_by = desc(sort_column)
    else:
        order_by = asc(sort_column)

    # Get orders
    orders, total = await order_service.get_orders_paginated(
        filters=filters,
        order_by=order_by,
        page=page,
        page_size=page_size
    )

    # Create paginated response
    return PaginatedResponse.create(
        items=orders,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(
        require_any_permission(["orders:read_all", "orders:read"])),
    tenant_id: str = Depends(get_current_tenant_id),
):
    """Get order by ID"""
    order_service = OrderService(db)
    order = await order_service.get_order_by_id(str(order_id), tenant_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    return order


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(require_permissions(["orders:create"])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
):
    """Create a new order"""
    order_service = OrderService(db)

    # Order service will use the tenant_id from the token
    order = await order_service.create_order(order_data, user_id, tenant_id)
    return order


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: UUID,
    order_data: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(require_any_permission(
        ["orders:update", "orders:update_own"])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
):
    """Update an order"""
    order_service = OrderService(db)

    # Check if order exists and belongs to tenant
    existing_order = await order_service.get_order_by_id(str(order_id), tenant_id)
    if not existing_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Check if order can be updated (only draft or submitted status)
    if existing_order.status not in [OrderStatus.DRAFT, OrderStatus.SUBMITTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order cannot be updated in current status"
        )

    # Check if user can update this order
    # Disabled - allowing users with update permission to update any order
    # if (not token_data.is_super_user() and
    #     "orders:update_own" in token_data.permissions and
    #         existing_order.created_by != user_id):
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="You can only update your own orders"
    #     )

    order = await order_service.update_order(str(order_id), order_data, user_id)
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(require_any_permission(
        ["orders:delete", "orders:delete_own"])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
):
    """Delete an order (soft delete)"""
    order_service = OrderService(db)

    # Check if order exists and belongs to tenant
    existing_order = await order_service.get_order_by_id(str(order_id), tenant_id)
    if not existing_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Check if order can be deleted (only draft status)
    if existing_order.status != OrderStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order cannot be deleted in current status"
        )

    # Check if user can delete this order
    # Disabled - allowing users with delete permission to delete any order
    # if (not token_data.is_super_user() and
    #     "orders:delete_own" in token_data.permissions and
    #         existing_order.created_by != user_id):
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="You can only delete your own orders"
    #     )

    await order_service.delete_order(str(order_id))


@router.post("/{order_id}/submit", response_model=OrderResponse)
async def submit_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(require_any_permission(
        ["orders:update", "orders:update_own"])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
):
    """Submit order for finance approval"""
    order_service = OrderService(db)

    # Check if order exists and belongs to tenant
    existing_order = await order_service.get_order_by_id(order_id, tenant_id)
    if not existing_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Check if user can submit this order
    if (not token_data.is_super_user() and
        "orders:update_own" in token_data.permissions and
            existing_order.created_by != UUID(user_id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit your own orders"
        )

    order = await order_service.submit_order(order_id, user_id, tenant_id)
    return order


@router.post("/{order_id}/finance-approval", response_model=OrderResponse)
async def finance_approval(
    order_id: UUID,
    approval_data: FinanceApprovalRequest,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(
        require_permissions(["orders:approve_finance"])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
):
    """Approve or reject order in finance - Requires finance approval permission"""
    order_service = OrderService(db)

    order = await order_service.finance_approval(
        order_id,
        approval_data.approved,
        user_id,
        tenant_id,
        approval_data.reason,
        approval_data.notes,
        approval_data.payment_type
    )
    return order


@router.post("/{order_id}/logistics-approval", response_model=OrderResponse)
async def logistics_approval(
    order_id: UUID,
    approval_data: LogisticsApprovalRequest,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(
        require_permissions(["orders:approve_logistics"])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
):
    """Approve or reject order in logistics - Requires logistics approval permission"""
    order_service = OrderService(db)

    order = await order_service.logistics_approval(
        order_id,
        approval_data.approved,
        user_id,
        tenant_id,
        approval_data.reason,
        approval_data.notes,
        approval_data.driver_id,
        approval_data.trip_id
    )
    return order


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    status_data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(
        require_permissions(["orders:status_update"])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
):
    """Update order status - Requires status update permission"""
    order_service = OrderService(db)

    order = await order_service.update_order_status(
        str(order_id),  # Convert UUID to string
        status_data.status,
        user_id,
        tenant_id,
        status_data.reason,
        status_data.notes
    )
    return order


@router.get("/{order_id}/history", response_model=List[OrderStatusHistoryResponse])
async def get_order_status_history(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(
        require_any_permission(["orders:read_all", "orders:read"])),
    tenant_id: str = Depends(get_current_tenant_id),
):
    """Get order status history"""
    order_service = OrderService(db)

    # Check if order exists and belongs to tenant
    order = await order_service.get_order_by_id(str(order_id), tenant_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    history = await order_service.get_order_status_history(str(order_id))

    # Convert to response schema
    return [
        OrderStatusHistoryResponse(
            from_status=item.from_status,
            to_status=item.to_status,
            reason=item.reason,
            notes=item.notes,
            created_at=item.created_at
        )
        for item in history
    ]


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: UUID,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(require_permissions(["orders:cancel"])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
):
    """Cancel an order - Requires order cancel permission"""
    order_service = OrderService(db)

    order = await order_service.cancel_order(
        str(order_id),  # Convert UUID to string
        user_id,
        tenant_id,
        reason
    )
    return order
