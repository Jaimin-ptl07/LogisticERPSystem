"""API endpoints for driver operations."""

from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.services.driver_service import DriverService
from src.schemas import (
    TripStatus, DeliveryStatus,
    TripSummary, DeliveryUpdate, TruckMaintenanceRequest,
    DriverTripListResponse, DriverTripDetailResponse,
    TripOrderResponse, ApiResponse
)
from src.config import settings

router = APIRouter()


@router.get("/trips", response_model=DriverTripListResponse)
async def get_driver_trips(
    status: Optional[TripStatus] = Query(None, description="Filter by trip status"),
    trip_date: Optional[date] = Query(None, description="Filter by trip date"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all trips assigned to the current driver.

    This endpoint returns a list of trips assigned to the driver,
    optionally filtered by status and/or date.
    """
    try:
        service = DriverService(db)
        response = await service.get_driver_trips(status=status, trip_date=trip_date)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trips/current", response_model=Optional[TripSummary])
async def get_current_trip(
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current active trip for the driver.

    Returns the most recent trip that is in 'loading' or 'on-route' status.
    """
    try:
        service = DriverService(db)
        trip = await service.get_current_active_trip()
        return trip
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trips/{trip_id}", response_model=DriverTripDetailResponse)
async def get_trip_detail(
    trip_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific trip.

    Returns the trip details including all orders assigned to the trip,
    ordered by sequence number.
    """
    # Validate trip_id
    if not trip_id or trip_id == "undefined" or trip_id.strip() == "":
        raise HTTPException(status_code=400, detail="Invalid trip ID")

    try:
        service = DriverService(db)
        trip_detail = await service.get_trip_detail(trip_id)

        if not trip_detail:
            raise HTTPException(status_code=404, detail="Trip not found")

        return trip_detail
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/trips/{trip_id}/orders/{order_id}/delivery", response_model=TripOrderResponse)
async def update_order_delivery_status(
    trip_id: str,
    order_id: str,
    update_data: DeliveryUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update the delivery status of an order.

    Allows the driver to mark orders as delivered, failed, or returned.
    This updates the delivery status in real-time.
    """
    # Validate trip_id and order_id
    if not trip_id or trip_id == "undefined" or trip_id.strip() == "":
        raise HTTPException(status_code=400, detail="Invalid trip ID")
    if not order_id or order_id == "undefined" or order_id.strip() == "":
        raise HTTPException(status_code=400, detail="Invalid order ID")

    try:
        service = DriverService(db)
        updated_order = await service.update_order_delivery_status(
            trip_id, order_id, update_data
        )

        if not updated_order:
            raise HTTPException(status_code=404, detail="Order not found")

        return updated_order
    except HTTPException:
        raise
    except ValueError as e:
        # Handle business logic validation errors (sequential delivery, status transitions)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trips/{trip_id}/maintenance", response_model=ApiResponse)
async def report_truck_maintenance(
    trip_id: str,
    maintenance_request: TruckMaintenanceRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Report truck maintenance and update trip status.

    Allows the driver to report truck issues, which updates the trip
    status to 'truck-malfunction' for real-time visibility.
    """
    try:
        service = DriverService(db)

        # Set trip_id from path parameter
        maintenance_request.trip_id = trip_id

        success = await service.report_truck_maintenance(maintenance_request)

        if not success:
            raise HTTPException(status_code=404, detail="Trip not found")

        return ApiResponse(
            success=True,
            message="Truck maintenance reported successfully",
            data={
                "trip_id": trip_id,
                "maintenance_type": maintenance_request.maintenance_type,
                "driver_id": settings.DRIVER_ID
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trips/{trip_id}/orders/{order_id}/status", response_model=TripOrderResponse)
async def get_order_status(
    trip_id: str,
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current status of a specific order in a trip.

    Returns the delivery status and other details of the order.
    """
    try:
        service = DriverService(db)
        trip_detail = await service.get_trip_detail(trip_id)

        if not trip_detail:
            raise HTTPException(status_code=404, detail="Trip not found")

        # Find the specific order
        order = None
        for o in trip_detail.orders:
            if o.order_id == order_id:
                order = o
                break

        if not order:
            raise HTTPException(status_code=404, detail="Order not found in trip")

        return order
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trips/{trip_id}/orders/{order_id}/deliver", response_model=ApiResponse)
async def mark_order_delivered(
    trip_id: str,
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Mark an order as delivered.

    This is a convenience endpoint to quickly mark an order as delivered.
    """
    try:
        service = DriverService(db)
        update_data = DeliveryUpdate(delivery_status=DeliveryStatus.DELIVERED)

        updated_order = await service.update_order_delivery_status(
            trip_id, order_id, update_data
        )

        if not updated_order:
            raise HTTPException(status_code=404, detail="Order not found")

        return ApiResponse(
            success=True,
            message="Order marked as delivered successfully",
            data={
                "trip_id": trip_id,
                "order_id": order_id,
                "delivery_status": "delivered"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))