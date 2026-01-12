"""
Trip Analytics API Endpoints
Provides trip status counts, durations, pause tracking, and inefficiency detection
"""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import text
import logging

from src.database import get_multi_db, MultiDBSession
from src.models.schemas import (
    DateRangePreset,
    DateRangeFilter,
    TripStatusCountsResponse,
    TripStatusCount,
    TripStatusDurationsResponse,
    TripStatusDuration,
    TripPausesResponse,
    PauseSummary,
    TripInefficienciesResponse,
    TripInefficiency,
)
from src.api.endpoints.orders import calculate_date_range

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/status-counts", response_model=TripStatusCountsResponse)
async def get_trip_status_counts(
    preset: DateRangePreset = Query(DateRangePreset.LAST_7_DAYS, description="Date range preset"),
    date_from: Optional[datetime] = Query(None, description="Custom date from"),
    date_to: Optional[datetime] = Query(None, description="Custom date to"),
    multi_db: MultiDBSession = Depends(get_multi_db),
):
    """
    Get trip counts by status

    Returns the number of trips in each status for the specified date range.
    Uses current trip status from the TMS database.
    """
    from datetime import datetime
    start_date, end_date = calculate_date_range(preset, date_from, date_to)

    try:
        # Get current status counts from TMS database
        sql_query = text("""
            SELECT status, COUNT(*) as count
            FROM trips
            WHERE created_at >= :start_date AND created_at <= :end_date
            GROUP BY status
            ORDER BY count DESC
        """)

        result = await multi_db.tms.execute(sql_query, {"start_date": start_date, "end_date": end_date})
        rows = result.all()

        status_counts = [
            TripStatusCount(status=row[0], count=row[1])
            for row in rows
        ]

        total_trips = sum(sc.count for sc in status_counts)

        return TripStatusCountsResponse(
            date_range=DateRangeFilter(preset=preset, date_from=date_from, date_to=date_to),
            total_trips=total_trips,
            status_counts=status_counts
        )
    except Exception as e:
        logger.error(f"Error getting trip status counts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get trip status counts: {str(e)}")


@router.get("/status-durations", response_model=TripStatusDurationsResponse)
async def get_trip_status_durations(
    preset: DateRangePreset = Query(DateRangePreset.LAST_7_DAYS, description="Date range preset"),
    date_from: Optional[datetime] = Query(None, description="Custom date from"),
    date_to: Optional[datetime] = Query(None, description="Custom date to"),
    multi_db: MultiDBSession = Depends(get_multi_db),
):
    """
    Get time spent by trips in each status

    Returns detailed breakdown of time each trip spent in different statuses.
    """
    from datetime import datetime
    start_date, end_date = calculate_date_range(preset, date_from, date_to)

    try:
        sql_query = text("""
            WITH trip_status_changes AS (
                SELECT
                    entity_id as trip_id,
                    from_status as status,
                    created_at as status_start,
                    LEAD(created_at) OVER (PARTITION BY entity_id ORDER BY created_at) as status_end
                FROM audit_logs
                WHERE tenant_id IN (SELECT DISTINCT tenant_id FROM audit_logs LIMIT 1)
                    AND module = 'trips'
                    AND entity_type = 'trip'
                    AND from_status IS NOT NULL
                    AND created_at >= :start_date
                    AND created_at <= :end_date
            )
            SELECT
                trip_id,
                status,
                EXTRACT(EPOCH FROM (COALESCE(status_end, NOW()) - status_start)) / 3600.0 as hours_in_status
            FROM trip_status_changes
            ORDER BY trip_id, status_start
            LIMIT 500
        """)

        result = await multi_db.company.execute(sql_query, {"start_date": start_date, "end_date": end_date})
        rows = result.all()

        durations = [
            TripStatusDuration(
                trip_id=row[0],
                status=row[1],
                hours_in_status=round(float(row[2]), 2)
            )
            for row in rows
        ]

        return TripStatusDurationsResponse(
            date_range=DateRangeFilter(preset=preset, date_from=date_from, date_to=date_to),
            durations=durations
        )
    except Exception as e:
        logger.error(f"Error getting trip status durations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get trip status durations: {str(e)}")


@router.get("/pauses", response_model=TripPausesResponse)
async def get_trip_pauses(
    preset: DateRangePreset = Query(DateRangePreset.LAST_7_DAYS, description="Date range preset"),
    date_from: Optional[datetime] = Query(None, description="Custom date from"),
    date_to: Optional[datetime] = Query(None, description="Custom date to"),
    multi_db: MultiDBSession = Depends(get_multi_db),
):
    """
    Calculate total pause time for trips

    Handles multiple pause events and accumulates total pause duration.
    """
    from datetime import datetime
    start_date, end_date = calculate_date_range(preset, date_from, date_to)

    try:
        sql_query = text("""
            WITH pause_events AS (
                SELECT
                    entity_id as trip_id,
                    created_at as paused_at,
                    LEAD(created_at) OVER (
                        PARTITION BY entity_id
                        ORDER BY created_at
                    ) as resumed_at
                FROM audit_logs
                WHERE tenant_id IN (SELECT DISTINCT tenant_id FROM audit_logs LIMIT 1)
                    AND module = 'trips'
                    AND entity_type = 'trip'
                    AND to_status = 'paused'
                    AND created_at >= :start_date
                    AND created_at <= :end_date
            ),
            pause_durations AS (
                SELECT
                    trip_id,
                    EXTRACT(EPOCH FROM (COALESCE(resumed_at, NOW()) - paused_at)) / 3600.0 as pause_hours
                FROM pause_events
            )
            SELECT
                trip_id,
                COUNT(*) as pause_count,
                SUM(pause_hours) as total_pause_hours,
                AVG(pause_hours) as avg_pause_hours,
                MAX(pause_hours) as max_pause_hours
            FROM pause_durations
            GROUP BY trip_id
            ORDER BY total_pause_hours DESC
        """)

        result = await multi_db.company.execute(sql_query, {"start_date": start_date, "end_date": end_date})
        rows = result.all()

        pause_summaries = [
            PauseSummary(
                trip_id=row[0],
                pause_count=row[1],
                total_pause_hours=round(float(row[2]), 2),
                avg_pause_hours=round(float(row[3]), 2),
                max_pause_hours=round(float(row[4]), 2)
            )
            for row in rows
        ]

        return TripPausesResponse(
            date_range=DateRangeFilter(preset=preset, date_from=date_from, date_to=date_to),
            pause_summaries=pause_summaries
        )
    except Exception as e:
        logger.error(f"Error getting trip pauses: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get trip pauses: {str(e)}")


@router.get("/inefficiencies", response_model=TripInefficienciesResponse)
async def get_trip_inefficiencies(
    preset: DateRangePreset = Query(DateRangePreset.LAST_7_DAYS, description="Date range preset"),
    date_from: Optional[datetime] = Query(None, description="Custom date from"),
    date_to: Optional[datetime] = Query(None, description="Custom date to"),
    expected_planning_hours: float = Query(2.0, description="Expected planning duration threshold"),
    expected_loading_hours: float = Query(1.0, description="Expected loading duration threshold"),
    multi_db: MultiDBSession = Depends(get_multi_db),
):
    """
    Identify trip inefficiencies (planning delay, loading delay, route delay)

    Returns trips that exceeded expected time thresholds for different stages.
    """
    from datetime import datetime
    start_date, end_date = calculate_date_range(preset, date_from, date_to)

    try:
        # Planning delay query
        planning_query = text("""
            SELECT
                entity_id as trip_id,
                'planning' as delay_type,
                :expected_planning as expected_hours,
                EXTRACT(EPOCH FROM (
                    MIN(CASE WHEN to_status = 'loading' THEN created_at END) -
                    MIN(CASE WHEN to_status = 'planning' THEN created_at END)
                )) / 3600.0 as actual_hours
            FROM audit_logs
            WHERE tenant_id IN (SELECT DISTINCT tenant_id FROM audit_logs LIMIT 1)
                AND module = 'trips'
                AND entity_type = 'trip'
                AND created_at >= :start_date
                AND created_at <= :end_date
            GROUP BY entity_id
            HAVING MIN(CASE WHEN to_status = 'loading' THEN created_at END) IS NOT NULL
                AND EXTRACT(EPOCH FROM (
                    MIN(CASE WHEN to_status = 'loading' THEN created_at END) -
                    MIN(CASE WHEN to_status = 'planning' THEN created_at END)
                )) / 3600.0 > :expected_planning
        """)

        # Loading delay query
        loading_query = text("""
            SELECT
                entity_id as trip_id,
                'loading' as delay_type,
                :expected_loading as expected_hours,
                EXTRACT(EPOCH FROM (
                    MIN(CASE WHEN to_status = 'on-route' THEN created_at END) -
                    MIN(CASE WHEN to_status = 'loading' THEN created_at END)
                )) / 3600.0 as actual_hours
            FROM audit_logs
            WHERE tenant_id IN (SELECT DISTINCT tenant_id FROM audit_logs LIMIT 1)
                AND module = 'trips'
                AND entity_type = 'trip'
                AND created_at >= :start_date
                AND created_at <= :end_date
            GROUP BY entity_id
            HAVING MIN(CASE WHEN to_status = 'on-route' THEN created_at END) IS NOT NULL
                AND EXTRACT(EPOCH FROM (
                    MIN(CASE WHEN to_status = 'on-route' THEN created_at END) -
                    MIN(CASE WHEN to_status = 'loading' THEN created_at END)
                )) / 3600.0 > :expected_loading
        """)

        planning_result = await multi_db.company.execute(
            planning_query,
            {"start_date": start_date, "end_date": end_date, "expected_planning": expected_planning_hours}
        )
        planning_rows = planning_result.all()

        loading_result = await multi_db.company.execute(
            loading_query,
            {"start_date": start_date, "end_date": end_date, "expected_loading": expected_loading_hours}
        )
        loading_rows = loading_result.all()

        inefficiencies = []

        for row in planning_rows:
            inefficiencies.append(TripInefficiency(
                trip_id=row[0],
                delay_type=row[1],
                expected_hours=expected_planning_hours,
                actual_hours=round(float(row[3]), 2),
                delay_hours=round(float(row[3]) - expected_planning_hours, 2)
            ))

        for row in loading_rows:
            inefficiencies.append(TripInefficiency(
                trip_id=row[0],
                delay_type=row[1],
                expected_hours=expected_loading_hours,
                actual_hours=round(float(row[3]), 2),
                delay_hours=round(float(row[3]) - expected_loading_hours, 2)
            ))

        return TripInefficienciesResponse(
            date_range=DateRangeFilter(preset=preset, date_from=date_from, date_to=date_to),
            inefficiencies=inefficiencies
        )
    except Exception as e:
        logger.error(f"Error getting trip inefficiencies: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get trip inefficiencies: {str(e)}")
