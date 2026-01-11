"""
Due Days endpoints for branch manager dashboard
"""
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from pydantic import BaseModel

from src.database import get_db
from src.models.order import Order, OrderStatus
from src.security import get_current_token_data, TokenData
from sqlalchemy.sql.expression import literal_column

router = APIRouter()


class MarkAsCreatedRequest(BaseModel):
    """Request to mark order as created"""
    order_ids: List[str]


@router.get("/orders")
async def get_due_days_orders(
    days_threshold: int = Query(3, ge=1, le=30, description="Days threshold for showing orders"),
    filter_date: Optional[str] = Query(None, description="Filter date (ISO format)"),
    status_filter: Optional[str] = Query(None, description="Filter by status: due_soon, overdue"),
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(get_current_token_data)
):
    """
    Get orders based on due days threshold.

    Shows orders where:
    - created_at + due_days <= current_date + days_threshold
    - NOT marked as created
    - Filters by tenant_id

    Query params:
    - days_threshold: Number of days to look ahead (default: 3)
    - filter_date: Date to calculate from (default: today)
    - status_filter: Filter by "due_soon" or "overdue"
    """
    tenant_id = token_data.tenant_id

    # Calculate reference date (use filter_date or today)
    if filter_date:
        try:
            reference_date = datetime.fromisoformat(filter_date.replace('Z', '+00:00'))
        except ValueError:
            reference_date = datetime.now(timezone.utc)
    else:
        reference_date = datetime.now(timezone.utc)

    # Calculate threshold date
    threshold_date = reference_date + timedelta(days=days_threshold)

    # Build base query
    query = select(Order).where(
        and_(
            Order.tenant_id == tenant_id,
            Order.due_days.isnot(None),
            Order.due_days_marked_created == False,
            Order.is_active == True
        )
    )

    # Fetch all orders and filter in Python (since SQLAlchemy interval arithmetic is complex)
    result = await db.execute(query)
    all_orders = result.scalars().all()

    # Filter orders based on due date calculation
    orders_with_status = []
    for order in all_orders:
        # Ensure created_at is timezone-aware
        created_at = order.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        due_date = created_at + timedelta(days=order.due_days or 0)
        days_remaining = (due_date - reference_date).days

        # Determine if order should be shown
        # Show if: within threshold period (before threshold_date)
        should_show = due_date <= threshold_date

        if not should_show:
            continue

        # Determine status
        if days_remaining < 0:
            due_status = "overdue"
        elif days_remaining <= days_threshold:
            due_status = "due_soon"
        else:
            due_status = "pending"

        # Apply status filter if provided
        if status_filter == "overdue" and due_status != "overdue":
            continue
        if status_filter == "due_soon" and due_status != "due_soon":
            continue

        orders_with_status.append({
            "id": str(order.id),
            "order_number": order.order_number,
            "customer_id": order.customer_id,
            "branch_id": order.branch_id,
            "due_days": order.due_days,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "delivery_date": due_date.isoformat(),
            "days_remaining": days_remaining,
            "due_status": due_status,
            "status": order.status,
            "total_amount": float(order.total_amount) if order.total_amount else 0,
            "order_type": order.order_type,
            "priority": order.priority
        })

    # Separate into overdue and due_soon, then sort by days remaining
    overdue_orders = sorted(
        [o for o in orders_with_status if o["due_status"] == "overdue"],
        key=lambda x: x["days_remaining"]  # Most negative first (most overdue)
    )
    due_soon_orders = sorted(
        [o for o in orders_with_status if o["due_status"] == "due_soon"],
        key=lambda x: x["days_remaining"]
    )

    return {
        "overdue_count": len(overdue_orders),
        "due_soon_count": len(due_soon_orders),
        "total_count": len(orders_with_status),
        "reference_date": reference_date.isoformat(),
        "threshold_date": threshold_date.isoformat(),
        "orders": overdue_orders + due_soon_orders  # Overdue first
    }


@router.post("/mark-created")
async def mark_orders_as_created(
    request: MarkAsCreatedRequest,
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(get_current_token_data)
):
    """
    Mark orders as created/dismissed from due days list.
    """
    tenant_id = token_data.tenant_id

    # Update orders
    updated_count = 0
    for order_id in request.order_ids:
        query = select(Order).where(
            and_(
                Order.id == order_id,
                Order.tenant_id == tenant_id
            )
        )
        result = await db.execute(query)
        order = result.scalar_one_or_none()

        if order:
            order.due_days_marked_created = True
            order.updated_by = token_data.user_id
            order.updated_at = datetime.utcnow()
            updated_count += 1

    await db.commit()

    return {
        "message": f"Marked {updated_count} orders as created",
        "count": updated_count
    }


@router.get("/statistics")
async def get_due_days_statistics(
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(get_current_token_data)
):
    """
    Get statistics for due days dashboard.
    """
    tenant_id = token_data.tenant_id
    today = datetime.now(timezone.utc)

    # Get all orders with due_days
    query = select(Order).where(
        and_(
            Order.tenant_id == tenant_id,
            Order.due_days.isnot(None),
            Order.due_days_marked_created == False,
            Order.is_active == True
        )
    )

    result = await db.execute(query)
    all_orders = result.scalars().all()

    # Calculate statistics in Python
    three_days_from_now = today + timedelta(days=3)

    overdue_count = 0
    due_soon_count = 0

    for order in all_orders:
        # Ensure created_at is timezone-aware
        created_at = order.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        due_date = created_at + timedelta(days=order.due_days or 0)
        days_remaining = (due_date - today).days

        if days_remaining < 0:
            overdue_count += 1
        elif days_remaining <= 3:  # Within 3 days
            due_soon_count += 1

    return {
        "overdue_count": overdue_count,
        "due_soon_count": due_soon_count,
        "total_due_count": overdue_count + due_soon_count
    }
