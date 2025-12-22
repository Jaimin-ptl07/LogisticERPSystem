"""
Finance reports API endpoints
Provides financial analytics and reporting capabilities
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc

from src.database import get_db
from src.models.approval import ApprovalAction, ApprovalStatus, ApprovalType
from src.security import (
    TokenData,
    require_any_permission,
    get_current_tenant_id,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/dashboard/summary")
async def get_dashboard_summary(
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(require_any_permission(["finance:read", "finance:reports"])),
    tenant_id: str = Depends(get_current_tenant_id),
):
    """
    Get financial dashboard summary with key metrics
    """
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    try:
        # Get approval statistics
        approval_stats_query = select(
            ApprovalAction.status,
            func.count(ApprovalAction.id).label('count'),
            func.sum(ApprovalAction.order_amount).label('total_amount')
        ).where(
            and_(
                ApprovalAction.tenant_id == tenant_id,
                ApprovalAction.approval_type == ApprovalType.FINANCE,
                ApprovalAction.created_at >= start_date,
                ApprovalAction.created_at <= end_date,
                ApprovalAction.is_active == True
            )
        ).group_by(ApprovalAction.status)

        approval_stats_result = await db.execute(approval_stats_query)
        approval_stats = approval_stats_result.all()

        # Convert to dict for easier access
        stats_dict = {status: {"count": 0, "amount": 0} for status in ApprovalStatus}
        for stat in approval_stats:
            stats_dict[stat.status] = {
                "count": stat.count,
                "amount": float(stat.total_amount) if stat.total_amount else 0
            }

        # Get daily approval trends
        daily_trends_query = select(
            func.date(ApprovalAction.created_at).label('date'),
            ApprovalAction.status,
            func.count(ApprovalAction.id).label('count'),
            func.sum(ApprovalAction.order_amount).label('amount')
        ).where(
            and_(
                ApprovalAction.tenant_id == tenant_id,
                ApprovalAction.approval_type == ApprovalType.FINANCE,
                ApprovalAction.created_at >= start_date,
                ApprovalAction.created_at <= end_date,
                ApprovalAction.is_active == True
            )
        ).group_by(
            func.date(ApprovalAction.created_at),
            ApprovalAction.status
        ).order_by(func.date(ApprovalAction.created_at))

        daily_trends_result = await db.execute(daily_trends_query)
        daily_trends = daily_trends_result.all()

        # Get top approvers
        top_approvers_query = select(
            ApprovalAction.approver_name,
            func.count(ApprovalAction.id).label('approvals_count'),
            func.sum(ApprovalAction.order_amount).label('total_amount')
        ).where(
            and_(
                ApprovalAction.tenant_id == tenant_id,
                ApprovalAction.approval_type == ApprovalType.FINANCE,
                ApprovalAction.created_at >= start_date,
                ApprovalAction.created_at <= end_date,
                ApprovalAction.approver_id.isnot(None),
                ApprovalAction.is_active == True
            )
        ).group_by(ApprovalAction.approver_id, ApprovalAction.approver_name).order_by(
            desc(func.count(ApprovalAction.id))
        ).limit(10)

        top_approvers_result = await db.execute(top_approvers_query)
        top_approvers = top_approvers_result.all()

        # Get pending approvals count and amount
        pending_query = select(
            func.count(ApprovalAction.id).label('count'),
            func.sum(ApprovalAction.order_amount).label('amount')
        ).where(
            and_(
                ApprovalAction.tenant_id == tenant_id,
                ApprovalAction.approval_type == ApprovalType.FINANCE,
                ApprovalAction.status == ApprovalStatus.PENDING,
                ApprovalAction.is_active == True
            )
        )

        pending_result = await db.execute(pending_query)
        pending_stats = pending_result.first()

        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": days
            },
            "summary": {
                "total_orders": stats_dict[ApprovalStatus.PENDING]["count"] +
                               stats_dict[ApprovalStatus.APPROVED]["count"] +
                               stats_dict[ApprovalStatus.REJECTED]["count"],
                "total_amount": stats_dict[ApprovalStatus.PENDING]["amount"] +
                              stats_dict[ApprovalStatus.APPROVED]["amount"] +
                              stats_dict[ApprovalStatus.REJECTED]["amount"],
                "pending_orders": stats_dict[ApprovalStatus.PENDING]["count"],
                "pending_amount": stats_dict[ApprovalStatus.PENDING]["amount"],
                "approved_orders": stats_dict[ApprovalStatus.APPROVED]["count"],
                "approved_amount": stats_dict[ApprovalStatus.APPROVED]["amount"],
                "rejected_orders": stats_dict[ApprovalStatus.REJECTED]["count"],
                "rejected_amount": stats_dict[ApprovalStatus.REJECTED]["amount"],
                "approval_rate": (
                    stats_dict[ApprovalStatus.APPROVED]["count"] /
                    (stats_dict[ApprovalStatus.APPROVED]["count"] +
                     stats_dict[ApprovalStatus.REJECTED]["count"])
                ) if (stats_dict[ApprovalStatus.APPROVED]["count"] + stats_dict[ApprovalStatus.REJECTED]["count"]) > 0 else 0
            },
            "daily_trends": [
                {
                    "date": str(trend.date),
                    "status": trend.status,
                    "count": trend.count,
                    "amount": float(trend.amount) if trend.amount else 0
                }
                for trend in daily_trends
            ],
            "top_approvers": [
                {
                    "approver_name": approver.approver_name,
                    "approvals_count": approver.approvals_count,
                    "total_amount": float(approver.total_amount) if approver.total_amount else 0
                }
                for approver in top_approvers
            ],
            "current_pending": {
                "count": pending_stats.count if pending_stats else 0,
                "amount": float(pending_stats.amount) if pending_stats and pending_stats.amount else 0
            }
        }

    except Exception as e:
        logger.error(f"Error generating dashboard summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate dashboard summary"
        )


@router.get("/approvals/performance")
async def get_approval_performance_report(
    approver_id: Optional[str] = Query(None, description="Filter by approver ID"),
    date_from: Optional[datetime] = Query(None, description="Filter by date from"),
    date_to: Optional[datetime] = Query(None, description="Filter by date to"),
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(require_any_permission(["finance:read", "finance:reports"])),
    tenant_id: str = Depends(get_current_tenant_id),
):
    """
    Get approval performance metrics and statistics
    """
    try:
        # Build base query
        base_conditions = [
            ApprovalAction.tenant_id == tenant_id,
            ApprovalAction.approval_type == ApprovalType.FINANCE,
            ApprovalAction.is_active == True
        ]

        if approver_id:
            base_conditions.append(ApprovalAction.approver_id == approver_id)
        if date_from:
            base_conditions.append(ApprovalAction.created_at >= date_from)
        if date_to:
            base_conditions.append(ApprovalAction.created_at <= date_to)

        # Get approval time statistics
        approval_time_query = select(
            ApprovalAction.approver_id,
            ApprovalAction.approver_name,
            func.count(ApprovalAction.id).label('total_approvals'),
            func.avg(
                func.extract('epoch', ApprovalAction.approved_at - ApprovalAction.created_at)
            ).label('avg_approval_time_seconds'),
            func.min(
                func.extract('epoch', ApprovalAction.approved_at - ApprovalAction.created_at)
            ).label('min_approval_time_seconds'),
            func.max(
                func.extract('epoch', ApprovalAction.approved_at - ApprovalAction.created_at)
            ).label('max_approval_time_seconds')
        ).where(
            and_(
                *base_conditions,
                ApprovalAction.status == ApprovalStatus.APPROVED,
                ApprovalAction.approved_at.isnot(None)
            )
        ).group_by(ApprovalAction.approver_id, ApprovalAction.approver_name)

        approval_time_result = await db.execute(approval_time_query)
        approval_time_stats = approval_time_result.all()

        # Get approval breakdown by status
        status_breakdown_query = select(
            ApprovalAction.status,
            func.count(ApprovalAction.id).label('count'),
            func.sum(ApprovalAction.order_amount).label('total_amount')
        ).where(and_(*base_conditions)).group_by(ApprovalAction.status)

        status_breakdown_result = await db.execute(status_breakdown_query)
        status_breakdown = status_breakdown_result.all()

        # Get daily approval volumes
        daily_volume_query = select(
            func.date(ApprovalAction.created_at).label('date'),
            func.count(ApprovalAction.id).label('total'),
            func.sum(func.case(
                (ApprovalAction.status == ApprovalStatus.APPROVED, 1),
                else_=0
            )).label('approved'),
            func.sum(func.case(
                (ApprovalAction.status == ApprovalStatus.REJECTED, 1),
                else_=0
            )).label('rejected')
        ).where(and_(*base_conditions)).group_by(
            func.date(ApprovalAction.created_at)
        ).order_by(func.date(ApprovalAction.created_at))

        daily_volume_result = await db.execute(daily_volume_query)
        daily_volume = daily_volume_result.all()

        return {
            "performance_metrics": [
                {
                    "approver_id": stat.approver_id,
                    "approver_name": stat.approver_name,
                    "total_approvals": stat.total_approvals,
                    "avg_approval_time_minutes": float(stat.avg_approval_time_seconds) / 60 if stat.avg_approval_time_seconds else 0,
                    "min_approval_time_minutes": float(stat.min_approval_time_seconds) / 60 if stat.min_approval_time_seconds else 0,
                    "max_approval_time_minutes": float(stat.max_approval_time_seconds) / 60 if stat.max_approval_time_seconds else 0
                }
                for stat in approval_time_stats
            ],
            "status_breakdown": [
                {
                    "status": breakdown.status,
                    "count": breakdown.count,
                    "total_amount": float(breakdown.total_amount) if breakdown.total_amount else 0
                }
                for breakdown in status_breakdown
            ],
            "daily_volume": [
                {
                    "date": str(volume.date),
                    "total": volume.total,
                    "approved": int(volume.approved),
                    "rejected": int(volume.rejected)
                }
                for volume in daily_volume
            ]
        }

    except Exception as e:
        logger.error(f"Error generating approval performance report: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate approval performance report"
        )


@router.get("/financial/summary")
async def get_financial_summary_report(
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    payment_type: Optional[str] = Query(None, description="Filter by payment type"),
    date_from: Optional[datetime] = Query(None, description="Filter by date from"),
    date_to: Optional[datetime] = Query(None, description="Filter by date to"),
    group_by: str = Query("month", regex="^(day|week|month|quarter)$", description="Group by period"),
    db: AsyncSession = Depends(get_db),
    token_data: TokenData = Depends(require_any_permission(["finance:read", "finance:reports"])),
    tenant_id: str = Depends(get_current_tenant_id),
):
    """
    Get financial summary report with revenue and approval statistics
    """
    try:
        # Build base conditions
        base_conditions = [
            ApprovalAction.tenant_id == tenant_id,
            ApprovalAction.approval_type == ApprovalType.FINANCE,
            ApprovalAction.status == ApprovalStatus.APPROVED,
            ApprovalAction.is_active == True
        ]

        if customer_id:
            base_conditions.append(ApprovalAction.customer_id == customer_id)
        if payment_type:
            base_conditions.append(ApprovalAction.payment_type == payment_type)
        if date_from:
            base_conditions.append(ApprovalAction.approved_at >= date_from)
        if date_to:
            base_conditions.append(ApprovalAction.approved_at <= date_to)

        # Get total approved amounts
        total_approved_query = select(
            func.count(ApprovalAction.id).label('order_count'),
            func.sum(ApprovalAction.order_amount).label('total_order_amount'),
            func.sum(ApprovalAction.approved_amount).label('total_approved_amount')
        ).where(and_(*base_conditions))

        total_approved_result = await db.execute(total_approved_query)
        total_approved = total_approved_result.first()

        # Get breakdown by customer
        customer_breakdown_query = select(
            ApprovalAction.customer_id,
            ApprovalAction.customer_name,
            func.count(ApprovalAction.id).label('order_count'),
            func.sum(ApprovalAction.order_amount).label('total_amount')
        ).where(and_(*base_conditions)).group_by(
            ApprovalAction.customer_id, ApprovalAction.customer_name
        ).order_by(desc(func.sum(ApprovalAction.order_amount))).limit(20)

        customer_breakdown_result = await db.execute(customer_breakdown_query)
        customer_breakdown = customer_breakdown_result.all()

        # Get breakdown by payment type
        payment_type_breakdown_query = select(
            ApprovalAction.payment_type,
            func.count(ApprovalAction.id).label('order_count'),
            func.sum(ApprovalAction.order_amount).label('total_amount')
        ).where(and_(*base_conditions)).group_by(ApprovalAction.payment_type)

        payment_type_breakdown_result = await db.execute(payment_type_breakdown_query)
        payment_type_breakdown = payment_type_breakdown_result.all()

        # Get time series data based on group_by parameter
        if group_by == "day":
            time_series_func = func.date(ApprovalAction.approved_at)
        elif group_by == "week":
            time_series_func = func.date_trunc('week', ApprovalAction.approved_at)
        elif group_by == "month":
            time_series_func = func.date_trunc('month', ApprovalAction.approved_at)
        else:  # quarter
            time_series_func = func.date_trunc('quarter', ApprovalAction.approved_at)

        time_series_query = select(
            time_series_func.label('period'),
            func.count(ApprovalAction.id).label('order_count'),
            func.sum(ApprovalAction.order_amount).label('total_amount')
        ).where(and_(*base_conditions)).group_by(time_series_func).order_by(time_series_func)

        time_series_result = await db.execute(time_series_query)
        time_series = time_series_result.all()

        return {
            "summary": {
                "total_orders": total_approved.order_count if total_approved else 0,
                "total_order_amount": float(total_approved.total_order_amount) if total_approved and total_approved.total_order_amount else 0,
                "total_approved_amount": float(total_approved.total_approved_amount) if total_approved and total_approved.total_approved_amount else 0
            },
            "customer_breakdown": [
                {
                    "customer_id": breakdown.customer_id,
                    "customer_name": breakdown.customer_name,
                    "order_count": breakdown.order_count,
                    "total_amount": float(breakdown.total_amount) if breakdown.total_amount else 0
                }
                for breakdown in customer_breakdown
            ],
            "payment_type_breakdown": [
                {
                    "payment_type": breakdown.payment_type,
                    "order_count": breakdown.order_count,
                    "total_amount": float(breakdown.total_amount) if breakdown.total_amount else 0
                }
                for breakdown in payment_type_breakdown
            ],
            "time_series": [
                {
                    "period": str(ts.period),
                    "order_count": ts.order_count,
                    "total_amount": float(ts.total_amount) if ts.total_amount else 0
                }
                for ts in time_series
            ],
            "filters": {
                "customer_id": customer_id,
                "payment_type": payment_type,
                "date_from": date_from.isoformat() if date_from else None,
                "date_to": date_to.isoformat() if date_to else None,
                "group_by": group_by
            }
        }

    except Exception as e:
        logger.error(f"Error generating financial summary report: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate financial summary report"
        )