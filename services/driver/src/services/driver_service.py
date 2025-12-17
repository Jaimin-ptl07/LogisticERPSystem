"""Business logic layer for Driver Service."""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, and_, desc
from datetime import datetime, date

from src.database import Trip, TripOrder, get_db
from src.schemas import (
    TripStatus, OrderStatus, DeliveryStatus,
    TripSummary, TripResponse, TripOrderResponse,
    DeliveryUpdate, TruckMaintenanceRequest,
    DriverTripListResponse, DriverTripDetailResponse,
    TripUpdate, TripOrderUpdate
)
from src.config import settings


class DriverService:
    """Service class for driver operations."""

    def __init__(self, db: AsyncSession):
        """Initialize driver service with database session."""
        self.db = db
        self.driver_id = settings.DRIVER_ID

    async def get_driver_trips(
        self,
        status: Optional[TripStatus] = None,
        trip_date: Optional[date] = None
    ) -> DriverTripListResponse:
        """
        Get all trips assigned to the current driver.

        Args:
            status: Optional status filter
            trip_date: Optional date filter

        Returns:
            DriverTripListResponse with trips and statistics
        """
        # Build base query
        query = select(Trip).where(Trip.driver_id == self.driver_id)

        # Add filters
        if status:
            query = query.where(Trip.status == status)
        if trip_date:
            query = query.where(Trip.trip_date == trip_date)

        # Order by trip_date and created_at
        query = query.order_by(desc(Trip.trip_date), desc(Trip.created_at))

        # Execute query
        result = await self.db.execute(query)
        trips = result.scalars().all()

        # Convert to response format
        trip_summaries = []
        for trip in trips:
            # Count orders for each trip
            order_count_query = select(func.count(TripOrder.id)).where(
                TripOrder.trip_id == trip.id
            )
            order_count_result = await self.db.execute(order_count_query)
            order_count = order_count_result.scalar() or 0

            # Count completed orders
            completed_query = select(func.count(TripOrder.id)).where(
                and_(
                    TripOrder.trip_id == trip.id,
                    TripOrder.delivery_status == DeliveryStatus.DELIVERED
                )
            )
            completed_result = await self.db.execute(completed_query)
            completed_orders = completed_result.scalar() or 0

            trip_summary = TripSummary(
                id=trip.id,
                status=trip.status,
                origin=trip.origin,
                destination=trip.destination,
                truck_plate=trip.truck_plate,
                truck_model=trip.truck_model,
                capacity_used=trip.capacity_used or 0,
                capacity_total=trip.capacity_total,
                trip_date=trip.trip_date,
                order_count=order_count,
                completed_orders=completed_orders
            )
            trip_summaries.append(trip_summary)

        # Calculate statistics
        total_trips = len(trips)
        active_trips = len([t for t in trips if t.status in [TripStatus.LOADING, TripStatus.ON_ROUTE]])
        completed_trips = len([t for t in trips if t.status == TripStatus.COMPLETED])

        return DriverTripListResponse(
            trips=trip_summaries,
            total=total_trips,
            active=active_trips,
            completed=completed_trips
        )

    async def get_trip_detail(self, trip_id: str) -> Optional[DriverTripDetailResponse]:
        """
        Get detailed information about a specific trip.

        Args:
            trip_id: The trip ID to retrieve

        Returns:
            DriverTripDetailResponse or None if not found
        """
        # Query trip
        query = select(Trip).where(
            and_(
                Trip.id == trip_id,
                Trip.driver_id == self.driver_id
            )
        )

        result = await self.db.execute(query)
        trip = result.scalar_one_or_none()

        if not trip:
            return None

        # Query orders separately with proper ordering
        orders_query = select(TripOrder).where(
            TripOrder.trip_id == trip_id
        ).order_by(TripOrder.sequence_number)

        orders_result = await self.db.execute(orders_query)
        orders = orders_result.scalars().all()

        # Convert to response format
        trip_response = TripResponse(
            id=trip.id,
            user_id=trip.user_id,
            company_id=trip.company_id,
            branch=trip.branch,
            truck_plate=trip.truck_plate,
            truck_model=trip.truck_model,
            truck_capacity=trip.truck_capacity,
            driver_id=trip.driver_id,
            driver_name=trip.driver_name,
            driver_phone=trip.driver_phone,
            status=trip.status,
            origin=trip.origin,
            destination=trip.destination,
            distance=trip.distance,
            estimated_duration=trip.estimated_duration,
            pre_trip_time=trip.pre_trip_time,
            post_trip_time=trip.post_trip_time,
            capacity_used=trip.capacity_used or 0,
            capacity_total=trip.capacity_total,
            trip_date=trip.trip_date,
            created_at=trip.created_at,
            updated_at=trip.updated_at
        )

        # Convert orders
        orders_response = []
        for order in orders:
            order_response = TripOrderResponse(
                id=order.id,
                trip_id=order.trip_id,
                user_id=order.user_id,
                company_id=order.company_id,
                order_id=order.order_id,
                customer=order.customer,
                customer_address=order.customer_address,
                status=order.status,
                delivery_status=order.delivery_status,
                total=order.total,
                weight=order.weight,
                volume=order.volume,
                items=order.items,
                priority=order.priority,
                sequence_number=order.sequence_number,
                address=order.address,
                assigned_at=order.assigned_at,
                original_order_id=order.original_order_id,
                original_items=order.original_items,
                original_weight=order.original_weight
            )
            orders_response.append(order_response)

        trip_response.orders = orders_response

        return DriverTripDetailResponse(
            trip=trip_response,
            orders=orders_response
        )

    async def update_order_delivery_status(
        self,
        trip_id: str,
        order_id: str,
        update_data: DeliveryUpdate
    ) -> Optional[TripOrderResponse]:
        """
        Update the delivery status of an order.

        Args:
            trip_id: The trip ID
            order_id: The order ID
            update_data: The delivery update data

        Returns:
            Updated TripOrderResponse or None if not found
        """
        # Query the trip order
        query = select(TripOrder).where(
            and_(
                TripOrder.trip_id == trip_id,
                TripOrder.order_id == order_id
            )
        )
        result = await self.db.execute(query)
        trip_order = result.scalar_one_or_none()

        if not trip_order:
            return None

        # Validate sequential delivery logic
        if update_data.delivery_status == DeliveryStatus.OUT_FOR_DELIVERY:
            # Check if previous orders in sequence are delivered
            previous_orders_query = select(TripOrder).where(
                and_(
                    TripOrder.trip_id == trip_id,
                    TripOrder.sequence_number < trip_order.sequence_number
                )
            ).order_by(TripOrder.sequence_number)

            previous_result = await self.db.execute(previous_orders_query)
            previous_orders = previous_result.scalars().all()

            for prev_order in previous_orders:
                if prev_order.delivery_status != DeliveryStatus.DELIVERED:
                    raise ValueError(f"Cannot start delivery of order {order_id}. Previous order {prev_order.order_id} (sequence {prev_order.sequence_number}) must be delivered first.")

        # Validate status transitions
        valid_transitions = {
            DeliveryStatus.PENDING: [DeliveryStatus.OUT_FOR_DELIVERY],
            DeliveryStatus.OUT_FOR_DELIVERY: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.RETURNED],
            DeliveryStatus.FAILED: [DeliveryStatus.OUT_FOR_DELIVERY],
            DeliveryStatus.RETURNED: [DeliveryStatus.OUT_FOR_DELIVERY],
            DeliveryStatus.DELIVERED: []  # Delivered orders cannot change status
        }

        current_status = trip_order.delivery_status
        if current_status in valid_transitions:
            if update_data.delivery_status not in valid_transitions[current_status]:
                raise ValueError(f"Invalid status transition from {current_status} to {update_data.delivery_status}")

        # Update the delivery status
        trip_order.delivery_status = update_data.delivery_status

        # If delivery is completed, update trip capacity used
        if update_data.delivery_status == DeliveryStatus.DELIVERED:
            # Query trip to update capacity
            trip_query = select(Trip).where(Trip.id == trip_id)
            trip_result = await self.db.execute(trip_query)
            trip = trip_result.scalar_one_or_none()

            if trip:
                # Reduce capacity used by delivered order weight
                new_capacity_used = max(0, (trip.capacity_used or 0) - trip_order.weight)

                # Update trip capacity
                await self.db.execute(
                    update(Trip)
                    .where(Trip.id == trip_id)
                    .values(capacity_used=new_capacity_used)
                )

        await self.db.commit()
        await self.db.refresh(trip_order)

        # Return updated order
        return TripOrderResponse(
            id=trip_order.id,
            trip_id=trip_order.trip_id,
            user_id=trip_order.user_id,
            company_id=trip_order.company_id,
            order_id=trip_order.order_id,
            customer=trip_order.customer,
            customer_address=trip_order.customer_address,
            status=trip_order.status,
            delivery_status=trip_order.delivery_status,
            total=trip_order.total,
            weight=trip_order.weight,
            volume=trip_order.volume,
            items=trip_order.items,
            priority=trip_order.priority,
            sequence_number=trip_order.sequence_number,
            address=trip_order.address,
            assigned_at=trip_order.assigned_at,
            original_order_id=trip_order.original_order_id,
            original_items=trip_order.original_items,
            original_weight=trip_order.original_weight
        )

    async def report_truck_maintenance(
        self,
        maintenance_request: TruckMaintenanceRequest
    ) -> bool:
        """
        Report truck maintenance and update trip status.

        Args:
            maintenance_request: The maintenance request data

        Returns:
            True if successful, False otherwise
        """
        # Update trip status to truck-malfunction
        update_query = (
            update(Trip)
            .where(
                and_(
                    Trip.id == maintenance_request.trip_id,
                    Trip.driver_id == self.driver_id
                )
            )
            .values(status=TripStatus.TRUCK_MALFUNCTION)
        )

        result = await self.db.execute(update_query)

        if result.rowcount == 0:
            await self.db.rollback()
            return False

        await self.db.commit()
        return True

    async def get_current_active_trip(self) -> Optional[TripSummary]:
        """
        Get the current active trip for the driver.

        Returns:
            TripSummary of current active trip or None
        """
        # Query for active trips (loading or on-route)
        query = select(Trip).where(
            and_(
                Trip.driver_id == self.driver_id,
                Trip.status.in_([TripStatus.LOADING, TripStatus.ON_ROUTE])
            )
        ).order_by(desc(Trip.created_at))

        result = await self.db.execute(query)
        trip = result.scalar_one_or_none()

        if not trip:
            return None

        # Count orders
        order_count_query = select(func.count(TripOrder.id)).where(
            TripOrder.trip_id == trip.id
        )
        order_count_result = await self.db.execute(order_count_query)
        order_count = order_count_result.scalar() or 0

        # Count completed orders
        completed_query = select(func.count(TripOrder.id)).where(
            and_(
                TripOrder.trip_id == trip.id,
                TripOrder.delivery_status == DeliveryStatus.DELIVERED
            )
        )
        completed_result = await self.db.execute(completed_query)
        completed_orders = completed_result.scalar() or 0

        return TripSummary(
            id=trip.id,
            status=trip.status,
            origin=trip.origin,
            destination=trip.destination,
            truck_plate=trip.truck_plate,
            truck_model=trip.truck_model,
            capacity_used=trip.capacity_used or 0,
            capacity_total=trip.capacity_total,
            trip_date=trip.trip_date,
            order_count=order_count,
            completed_orders=completed_orders
        )