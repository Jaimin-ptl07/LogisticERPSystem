"""Trip business logic services"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from datetime import date

from src.database import Trip, TripOrder
from src.schemas import TripCreate, TripUpdate
from src.audit_client import AuditClient


class TripService:
    """Service for trip operations"""

    def __init__(self, db: AsyncSession, auth_headers: dict = None):
        self.db = db
        # Initialize audit client with auth token
        auth_token = auth_headers.get("authorization", "").replace("Bearer ", "") if auth_headers else None
        self.audit_client = AuditClient(auth_token=auth_token)

    @staticmethod
    async def create_trip(
        db: AsyncSession,
        trip_data: TripCreate,
        user_id: str = None,
        tenant_id: str = None,
        audit_client: AuditClient = None
    ) -> Trip:
        """Create a new trip"""
        from uuid import uuid4

        # Generate unique trip ID
        trip_id = f"TRIP-{uuid4().hex[:8].upper()}"

        # Create trip instance
        trip = Trip(
            id=trip_id,
            **trip_data.dict()
        )

        db.add(trip)
        await db.commit()
        await db.refresh(trip)

        # Log audit event for trip creation
        if audit_client and user_id and tenant_id:
            try:
                await audit_client.log_trip_created(
                    tenant_id=tenant_id,
                    user_id=user_id,
                    trip_id=trip_id,
                    truck_plate=trip.truck_plate,
                    driver_name=trip.driver_name,
                    metadata={
                        "origin": trip.origin,
                        "capacity_total": trip.capacity_total
                    }
                )
            except Exception as audit_error:
                import logging
                logging.getLogger(__name__).warning(f"Audit logging failed: {audit_error}")

        return trip

    @staticmethod
    async def get_trip_statistics(db: AsyncSession) -> dict:
        """Get trip statistics"""
        # Count trips by status
        status_counts = await db.execute(
            select(
                Trip.status,
                func.count(Trip.id).label('count')
            ).group_by(Trip.status)
        )

        stats = {
            "total_trips": 0,
            "by_status": {},
            "capacity_utilization": 0
        }

        for status, count in status_counts:
            stats["by_status"][status] = count
            stats["total_trips"] += count

        # Calculate average capacity utilization
        capacity_avg = await db.execute(
            select(func.avg(
                func.cast(Trip.capacity_used, float) /
                func.nullif(Trip.capacity_total, 0) * 100
            ))
        )
        avg_capacity = capacity_avg.scalar()
        if avg_capacity:
            stats["capacity_utilization"] = round(avg_capacity, 2)

        return stats

    @staticmethod
    async def optimize_trips(db: AsyncSession) -> List[Trip]:
        """Optimize trip assignments based on priority and capacity"""
        # Get all planning trips
        planning_trips = await db.execute(
            select(Trip).where(Trip.status == "planning")
        )
        trips = planning_trips.scalars().all()

        # TODO: Implement optimization algorithm
        # For now, return trips sorted by capacity utilization
        return sorted(trips, key=lambda t: t.capacity_used / t.capacity_total if t.capacity_total > 0 else 0)