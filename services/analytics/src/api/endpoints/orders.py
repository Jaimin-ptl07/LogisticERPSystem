"""
Order Analytics API Endpoints
Provides order status counts, durations, lifecycle times, and bottleneck detection
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func, case, text
from datetime import datetime, timedelta
import logging

from src.database import get_multi_db, MultiDBSession, AuditLog, Order
from src.models.schemas import (
    DateRangePreset,
    DateRangeFilter,
    OrderStatusCountsResponse,
    OrderStatusCount,
    OrderStatusDurationsResponse,
    StatusDurationMetrics,
    OrderLifecyclesResponse,
    OrderLifecycle,
    OrderBottlenecksResponse,
    OrderBottleneck,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def calculate_date_range(preset: DateRangePreset, date_from: Optional[datetime], date_to: Optional[datetime]) -> tuple:
    """Calculate actual date_from and date_to based on preset"""
    if preset == DateRangePreset.CUSTOM:
        if not date_from or not date_to:
            raise HTTPException(status_code=400, detail="Custom range requires date_from and date_to")
        return date_from, date_to

    now = datetime.utcnow()
    if preset == DateRangePreset.TODAY:
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return start_of_day, now
    elif preset == DateRangePreset.LAST_7_DAYS:
        return now - timedelta(days=7), now
    elif preset == DateRangePreset.LAST_30_DAYS:
        return now - timedelta(days=30), now

    return now - timedelta(days=7), now


@router.get("/status-counts", response_model=OrderStatusCountsResponse)
async def get_order_status_counts(
    preset: DateRangePreset = Query(DateRangePreset.LAST_7_DAYS, description="Date range preset"),
    date_from: Optional[datetime] = Query(None, description="Custom date from"),
    date_to: Optional[datetime] = Query(None, description="Custom date to"),
    multi_db: MultiDBSession = Depends(get_multi_db),
):
    """
    Get order counts by status

    Returns the number of orders in each status for the specified date range.
    Uses current order status from the orders database.
    """
    start_date, end_date = calculate_date_range(preset, date_from, date_to)

    try:
        # Get current status counts from orders database
        query = select(
            Order.status,
            func.count(Order.id).label('count')
        ).where(
            and_(
                Order.is_active == True,
                Order.created_at >= start_date,
                Order.created_at <= end_date
            )
        ).group_by(Order.status)

        result = await multi_db.orders.execute(query)
        rows = result.all()

        status_counts = [
            OrderStatusCount(status=row[0], count=row[1])
            for row in rows
        ]

        total_orders = sum(sc.count for sc in status_counts)

        return OrderStatusCountsResponse(
            date_range=DateRangeFilter(preset=preset, date_from=date_from, date_to=date_to),
            total_orders=total_orders,
            status_counts=status_counts
        )
    except Exception as e:
        logger.error(f"Error getting order status counts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get order status counts: {str(e)}")


@router.get("/status-durations", response_model=OrderStatusDurationsResponse)
async def get_order_status_durations(
    preset: DateRangePreset = Query(DateRangePreset.LAST_7_DAYS, description="Date range preset"),
    date_from: Optional[datetime] = Query(None, description="Custom date from"),
    date_to: Optional[datetime] = Query(None, description="Custom date to"),
    multi_db: MultiDBSession = Depends(get_multi_db),
):
    """
    Get average time spent in each order status

    Calculates the average, min, max, and median hours orders spend in each status
    based on audit log status transitions.
    """
    start_date, end_date = calculate_date_range(preset, date_from, date_to)

    try:
        # Complex SQL query to calculate status durations from audit logs
        # Using window functions to find next status change
        sql_query = text("""
            WITH status_durations AS (
                SELECT
                    from_status,
                    EXTRACT(EPOCH FROM (
                        LEAD(created_at) OVER (PARTITION BY entity_id ORDER BY created_at) - created_at
                    )) / 3600.0 as hours_spent
                FROM audit_logs
                WHERE tenant_id IN (SELECT DISTINCT tenant_id FROM audit_logs LIMIT 1)
                    AND module = 'orders'
                    AND entity_type = 'order'
                    AND from_status IS NOT NULL
                    AND from_status != ''
                    AND created_at >= :start_date
                    AND created_at <= :end_date
            )
            SELECT
                from_status as status,
                AVG(hours_spent) as avg_hours,
                MIN(hours_spent) as min_hours,
                MAX(hours_spent) as max_hours,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY hours_spent) as median_hours,
                COUNT(*) as sample_count
            FROM status_durations
            WHERE hours_spent IS NOT NULL AND hours_spent >= 0
            GROUP BY from_status
            ORDER BY avg_hours DESC
        """)

        result = await multi_db.company.execute(sql_query, {"start_date": start_date, "end_date": end_date})
        rows = result.all()

        durations = [
            StatusDurationMetrics(
                status=row[0],
                avg_hours=round(float(row[1]), 2) if row[1] else 0,
                min_hours=round(float(row[2]), 2) if row[2] else 0,
                max_hours=round(float(row[3]), 2) if row[3] else 0,
                median_hours=round(float(row[4]), 2) if row[4] else 0,
                sample_count=row[5]
            )
            for row in rows
        ]

        return OrderStatusDurationsResponse(
            date_range=DateRangeFilter(preset=preset, date_from=date_from, date_to=date_to),
            durations=durations
        )
    except Exception as e:
        logger.error(f"Error getting order status durations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get order status durations: {str(e)}")


@router.get("/lifecycle-times", response_model=OrderLifecyclesResponse)
async def get_order_lifecycle_times(
    preset: DateRangePreset = Query(DateRangePreset.LAST_7_DAYS, description="Date range preset"),
    date_from: Optional[datetime] = Query(None, description="Custom date from"),
    date_to: Optional[datetime] = Query(None, description="Custom date to"),
    multi_db: MultiDBSession = Depends(get_multi_db),
):
    """
    Get order lifecycle times from creation to delivery/cancellation

    Calculates the total time each order took from creation (draft) to delivery or cancellation.
    """
    start_date, end_date = calculate_date_range(preset, date_from, date_to)

    try:
        # Query to get order lifecycle from audit logs
        sql_query = text("""
            SELECT
                entity_id,
                MIN(CASE WHEN to_status = 'draft' THEN created_at END) as created_at,
                MIN(CASE WHEN to_status = 'delivered' THEN created_at END) as delivered_at,
                MIN(CASE WHEN to_status = 'cancelled' THEN created_at END) as cancelled_at,
                CASE
                    WHEN MIN(CASE WHEN to_status = 'delivered' THEN created_at END) IS NOT NULL THEN
                        EXTRACT(EPOCH FROM (
                            MIN(CASE WHEN to_status = 'delivered' THEN created_at END) -
                            MIN(CASE WHEN to_status = 'draft' THEN created_at END)
                        )) / 3600.0
                    WHEN MIN(CASE WHEN to_status = 'cancelled' THEN created_at END) IS NOT NULL THEN
                        EXTRACT(EPOCH FROM (
                            MIN(CASE WHEN to_status = 'cancelled' THEN created_at END) -
                            MIN(CASE WHEN to_status = 'draft' THEN created_at END)
                        )) / 3600.0
                    ELSE NULL
                END as lifecycle_hours
            FROM audit_logs
            WHERE tenant_id IN (SELECT DISTINCT tenant_id FROM audit_logs LIMIT 1)
                AND module = 'orders'
                AND entity_type = 'order'
                AND created_at >= :start_date
                AND created_at <= :end_date
            GROUP BY entity_id
            HAVING MIN(CASE WHEN to_status = 'draft' THEN created_at END) IS NOT NULL
            LIMIT 100
        """)

        result = await multi_db.company.execute(sql_query, {"start_date": start_date, "end_date": end_date})
        rows = result.all()

        orders = [
            OrderLifecycle(
                entity_id=row[0],
                created_at=row[1],
                delivered_at=row[2],
                cancelled_at=row[3],
                lifecycle_hours=round(float(row[4]), 2) if row[4] else None
            )
            for row in rows
        ]

        # Calculate average lifecycle
        completed_lifecycles = [o.lifecycle_hours for o in orders if o.lifecycle_hours is not None]
        avg_lifecycle = round(sum(completed_lifecycles) / len(completed_lifecycles), 2) if completed_lifecycles else 0

        return OrderLifecyclesResponse(
            date_range=DateRangeFilter(preset=preset, date_from=date_from, date_to=date_to),
            orders=orders,
            avg_lifecycle_hours=avg_lifecycle
        )
    except Exception as e:
        logger.error(f"Error getting order lifecycle times: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get order lifecycle times: {str(e)}")


@router.get("/bottlenecks", response_model=OrderBottlenecksResponse)
async def get_order_bottlenecks(
    preset: DateRangePreset = Query(DateRangePreset.LAST_7_DAYS, description="Date range preset"),
    date_from: Optional[datetime] = Query(None, description="Custom date from"),
    date_to: Optional[datetime] = Query(None, description="Custom date to"),
    threshold_hours: float = Query(4.0, description="Hours threshold to consider as bottleneck"),
    multi_db: MultiDBSession = Depends(get_multi_db),
):
    """
    Identify orders stuck in a status (bottlenecks)

    Returns status counts for orders that have been stuck in a status longer than the threshold.
    """
    start_date, end_date = calculate_date_range(preset, date_from, date_to)

    try:
        # Query to find orders stuck in each status
        sql_query = text("""
            WITH latest_status_change AS (
                SELECT DISTINCT ON (entity_id)
                    entity_id,
                    to_status as current_status,
                    created_at as status_since
                FROM audit_logs
                WHERE tenant_id IN (SELECT DISTINCT tenant_id FROM audit_logs LIMIT 1)
                    AND module = 'orders'
                    AND entity_type = 'order'
                    AND to_status NOT IN ('delivered', 'cancelled')
                    AND created_at <= :end_date
                ORDER BY entity_id, created_at DESC
            )
            SELECT
                current_status,
                COUNT(*) as stuck_count,
                AVG(EXTRACT(EPOCH FROM (NOW() - status_since)) / 3600.0) as avg_hours_stuck,
                MAX(EXTRACT(EPOCH FROM (NOW() - status_since)) / 3600.0) as max_hours_stuck
            FROM latest_status_change
            WHERE EXTRACT(EPOCH FROM (NOW() - status_since)) / 3600.0 > :threshold
            GROUP BY current_status
            ORDER BY stuck_count DESC
        """)

        result = await multi_db.company.execute(
            sql_query,
            {"start_date": start_date, "end_date": end_date, "threshold": threshold_hours}
        )
        rows = result.all()

        bottlenecks = [
            OrderBottleneck(
                current_status=row[0],
                stuck_count=row[1],
                avg_hours_stuck=round(float(row[2]), 2),
                max_hours_stuck=round(float(row[3]), 2)
            )
            for row in rows
        ]

        return OrderBottlenecksResponse(
            date_range=DateRangeFilter(preset=preset, date_from=date_from, date_to=date_to),
            threshold_hours=threshold_hours,
            bottlenecks=bottlenecks
        )
    except Exception as e:
        logger.error(f"Error getting order bottlenecks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get order bottlenecks: {str(e)}")
