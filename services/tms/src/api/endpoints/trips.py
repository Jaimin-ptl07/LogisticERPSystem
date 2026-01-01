"""Trip API endpoints with reordering functionality"""

import os
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, update
from datetime import date
from httpx import AsyncClient
import uuid
import logging

from src.database import get_db, Trip, TripOrder
from src.schemas import (
    TripCreate, TripUpdate, TripResponse, TripWithOrders,
    AssignOrdersRequest, TripOrderCreate, TripOrderResponse,
    MessageResponse, ReorderOrdersRequest
)
from src.security import (
    TokenData,
    require_permissions,
    require_any_permission,
    get_current_tenant_id,
    get_current_user_id
)
from src.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(
    dependencies=[Depends(HTTPBearer())],
    responses={
        401: {"description": "Unauthorized - Invalid or missing token"},
        403: {"description": "Forbidden - Insufficient permissions"}
    },
    tags=["trips"]
)

logger = logging.getLogger(__name__)

# Company service URL
COMPANY_SERVICE_URL = "http://company-service:8002"


@router.get(
    "",
    response_model=List[TripResponse],
    responses={401: {"description": "Unauthorized"},
               403: {"description": "Forbidden"}},
    summary="Get all trips",
    description="Retrieve a list of all trips with optional filtering"
)
async def get_trips(
    request: Request,
    status: Optional[str] = Query(None, description="Filter by trip status"),
    branch: Optional[str] = Query(None, description="Filter by branch"),
    trip_date: Optional[date] = Query(None, description="Filter by trip date"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    company_id: Optional[str] = Query(
        None, description="Filter by company ID"),
    token_data: TokenData = Depends(
        require_any_permission(["trips:read_all", "trips:read"])),
    tenant_id: str = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Get all trips with optional filters"""
    # Get authorization header from the request and forward it
    auth_headers = {}
    auth_header = request.headers.get("authorization")
    if auth_header:
        auth_headers["Authorization"] = auth_header

    # Build base query with tenant isolation
    query = select(Trip).where(Trip.company_id == tenant_id)

    # Check if user is Super Admin or Admin - if not, filter by assigned branches
    is_admin = token_data.role == "Admin" or token_data.is_super_user()
    logger.info(f"Trips access check - user_id: {token_data.user_id}, role: {token_data.role}, is_super_user: {token_data.is_super_user()}, is_admin: {is_admin}")

    if not is_admin:
        # Fetch assigned branches for non-admin users
        try:
            async with AsyncClient(timeout=30.0) as client:
                branches_response = await client.get(
                    f"{COMPANY_SERVICE_URL}/branches/my/assigned",
                    params={
                        "is_active": True,
                        "per_page": 100,
                        "tenant_id": tenant_id
                    },
                    headers=auth_headers
                )

                if branches_response.status_code == 200:
                    branches_data = branches_response.json()
                    # Get branch IDs for filtering - Trip.branch contains the branch UUID
                    assigned_branch_ids = [branch["id"] for branch in branches_data.get("items", [])]

                    if assigned_branch_ids:
                        # Filter trips by assigned branch IDs (Trip.branch contains UUID)
                        query = query.where(Trip.branch.in_(assigned_branch_ids))
                        logger.info(f"Filtering trips by assigned branch IDs: {assigned_branch_ids}")
                    else:
                        # No assigned branches - return empty result
                        logger.warning(f"No assigned branches found for user {token_data.user_id}")
                        return []
                else:
                    logger.error(f"Failed to fetch assigned branches: {branches_response.status_code}")
        except Exception as e:
            logger.error(f"Error fetching assigned branches: {str(e)}")

    # Apply additional filters
    if status:
        query = query.where(Trip.status == status)
    if branch:
        query = query.where(Trip.branch == branch)
    if trip_date:
        query = query.where(Trip.trip_date == trip_date)
    if user_id:
        query = query.where(Trip.user_id == user_id)
    # Note: company_id is used for tenant_id, so we don't need the extra filter

    # Order by created date descending
    query = query.order_by(Trip.created_at.desc())

    result = await db.execute(query)
    trips = result.scalars().all()

    # Convert to response models with orders
    trip_responses = []

    # Fetch all orders from Orders service to get items data (with pagination)
    orders_with_items = {}
    try:
        async with AsyncClient(timeout=30.0) as client:
            # Fetch all pages of orders
            all_orders = []
            current_page = 1
            total_pages = 1

            while current_page <= total_pages:
                orders_response = await client.get(
                    f"{settings.ORDERS_SERVICE_URL}/api/v1/orders/",
                    params={
                        "tenant_id": tenant_id,
                        "per_page": 100,  # Max per_page value
                        "page": current_page
                    },
                    headers=auth_headers
                )
                logger.info(f"Orders service response status: {orders_response.status_code}")

                if orders_response.status_code != 200:
                    logger.error(f"Failed to fetch orders: status {orders_response.status_code}, response: {orders_response.text}")
                    break

                orders_data = orders_response.json()
                orders = orders_data.get("items", [])
                all_orders.extend(orders)

                # Update pagination info
                total_pages = orders_data.get("pages", 1)
                current_page += 1

            logger.info(f"Fetched {len(all_orders)} total orders from Orders service")

            # Index orders by order_number for quick lookup
            for order in all_orders:
                order_key = order.get("order_number") or order.get("id")
                orders_with_items[order_key] = order
                # Also index by 'id' in case order_id matches the UUID
                if order.get("id"):
                    orders_with_items[order["id"]] = order
            logger.info(f"Fetched {len(orders_with_items)} orders with items data")
            logger.info(f"Sample orders_with_items keys: {list(orders_with_items.keys())[:5]}")
    except Exception as e:
        logger.error(f"Error fetching orders with items: {str(e)}", exc_info=True)

    for trip in trips:
        # Get orders for this trip ordered by sequence_number
        orders_query = select(TripOrder).where(
            TripOrder.trip_id == trip.id).order_by(TripOrder.sequence_number)
        if user_id:
            orders_query = orders_query.where(TripOrder.user_id == user_id)
        if company_id:
            orders_query = orders_query.where(
                TripOrder.company_id == company_id)

        orders_result = await db.execute(orders_query)
        orders = orders_result.scalars().all()

        # Convert orders to TripOrderResponse format with items_data
        order_responses = []
        for order in orders:
            # Get items data from the orders_with_items dictionary
            order_with_items = orders_with_items.get(order.order_id, {})
            items_data = order_with_items.get("items", [])

            # Use items_json if available (for split orders), otherwise use items_data from Orders service
            display_items = order.items_json if order.items_json else items_data

            # Debug logging
            if order.order_id not in orders_with_items:
                logger.warning(f"Order {order.order_id} not found in orders_with_items. Available keys: {list(orders_with_items.keys())[:10]}")
            logger.info(f"Trip order_id: {order.order_id}, items_data length: {len(items_data)}, items_json length: {len(order.items_json) if order.items_json else 0}")

            order_response = TripOrderResponse(
                id=order.id,
                trip_id=order.trip_id,
                user_id=order.user_id,
                company_id=order.company_id,
                order_id=order.order_id,
                customer=order.customer,
                customer_address=order.customer_address,
                customer_contact=order.customer_contact,
                customer_phone=order.customer_phone,
                product_name=order.product_name,
                status=order.status,
                tms_order_status=order.tms_order_status,
                total=order.total,
                weight=order.weight,
                volume=order.volume,
                items=order.items,
                items_data=display_items,  # Use items_json if available, otherwise items_data from Orders service
                items_json=order.items_json,
                remaining_items_json=order.remaining_items_json,
                quantity=order.quantity,
                priority=order.priority,
                delivery_status=order.delivery_status,
                sequence_number=order.sequence_number or 0,  # Default to 0 if null
                address=order.address,
                special_instructions=order.special_instructions,
                delivery_instructions=order.delivery_instructions,
                original_order_id=order.original_order_id,
                original_items=order.original_items,
                original_weight=order.original_weight,
                assigned_at=order.assigned_at
            )
            order_responses.append(order_response)

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
            capacity_used=trip.capacity_used,
            capacity_total=trip.capacity_total,
            trip_date=trip.trip_date,
            created_at=trip.created_at,
            updated_at=trip.updated_at
        )

        # Add orders to the response
        trip_response.orders = order_responses
        trip_responses.append(trip_response)

    # Log sample response for debugging
    if trip_responses:
        sample_trip = trip_responses[0]
        logger.info(f"Sample trip response: id={sample_trip.id}, orders_count={len(sample_trip.orders)}")
        if sample_trip.orders:
            sample_order = sample_trip.orders[0]
            logger.info(f"Sample order: order_id={sample_order.order_id}, items={sample_order.items}, items_data_length={len(sample_order.items_data) if sample_order.items_data else 0}")

    return trip_responses


@router.get("/{trip_id}", response_model=TripWithOrders)
async def get_trip(
    trip_id: str,
    request: Request,
    token_data: TokenData = Depends(
        require_any_permission(["trips:read_all", "trips:read"])),
    tenant_id: str = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Get trip by ID with associated orders"""
    # Get authorization header from the request and forward it
    auth_headers = {}
    auth_header = request.headers.get("authorization")
    if auth_header:
        auth_headers["Authorization"] = auth_header

    # Check if user is Super Admin or Admin - if not, filter by assigned branches
    is_admin = token_data.role == "Admin" or token_data.is_super_user()
    logger.info(f"Trip access check - user_id: {token_data.user_id}, role: {token_data.role}, is_super_user: {token_data.is_super_user()}, is_admin: {is_admin}")

    # Build base query
    query = select(Trip).where(
        and_(
            Trip.id == trip_id,
            Trip.company_id == tenant_id
        )
    )

    # For non-admin users, verify the trip belongs to an assigned branch
    if not is_admin:
        try:
            async with AsyncClient(timeout=30.0) as client:
                branches_response = await client.get(
                    f"{COMPANY_SERVICE_URL}/branches/my/assigned",
                    params={
                        "is_active": True,
                        "per_page": 100,
                        "tenant_id": tenant_id
                    },
                    headers=auth_headers
                )

                if branches_response.status_code == 200:
                    branches_data = branches_response.json()
                    # Get branch names since Trip.branch stores the branch name as a string
                    assigned_branch_names = [branch["name"] for branch in branches_data.get("items", [])]
                    assigned_branch_ids = [branch["id"] for branch in branches_data.get("items", [])]

                    if assigned_branch_names:
                        # Filter trips by assigned branch names
                        query = query.where(Trip.branch.in_(assigned_branch_names))
                        logger.info(f"Filtering trip by assigned branch names: {assigned_branch_names} (IDs: {assigned_branch_ids})")
                    else:
                        # No assigned branches - trip not accessible
                        logger.warning(f"No assigned branches found for user {token_data.user_id}")
                        raise HTTPException(status_code=403, detail="Trip not found or no access to assigned branches")
                else:
                    logger.error(f"Failed to fetch assigned branches: {branches_response.status_code}")
                    raise HTTPException(status_code=403, detail="Failed to verify branch access")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching assigned branches: {str(e)}")
            raise HTTPException(status_code=403, detail="Failed to verify branch access")

    result = await db.execute(query)
    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Get trip orders ordered by sequence_number
    orders_query = select(TripOrder).where(
        TripOrder.trip_id == trip_id).order_by(TripOrder.sequence_number)
    orders_result = await db.execute(orders_query)
    orders = orders_result.scalars().all()

    # Convert to response models
    trip_response = TripWithOrders(
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
        capacity_used=trip.capacity_used,
        capacity_total=trip.capacity_total,
        trip_date=trip.trip_date,
        created_at=trip.created_at,
        updated_at=trip.updated_at,
        orders=[
            TripOrderResponse(
                id=order.id,
                trip_id=order.trip_id,
                user_id=order.user_id,
                company_id=order.company_id,
                order_id=order.order_id,
                customer=order.customer,
                customer_address=order.customer_address,
                customer_contact=order.customer_contact,
                customer_phone=order.customer_phone,
                product_name=order.product_name,
                status=order.status,
                tms_order_status=order.tms_order_status,
                total=order.total,
                weight=order.weight,
                volume=order.volume,
                items=order.items,
                items_data=order.items_json or [],  # Use items_json if available
                items_json=order.items_json,
                remaining_items_json=order.remaining_items_json,
                quantity=order.quantity or 1,  # Default to 1 if null
                priority=order.priority,
                delivery_status=order.delivery_status or "pending",
                sequence_number=order.sequence_number or 0,  # Default to 0 if null
                address=order.address,
                special_instructions=order.special_instructions,
                delivery_instructions=order.delivery_instructions,
                original_order_id=order.original_order_id,
                original_items=order.original_items,
                original_weight=order.original_weight,
                assigned_at=order.assigned_at
            )
            for order in orders
        ]
    )

    return trip_response


@router.post("", response_model=TripResponse)
async def create_trip(
    trip_data: TripCreate,
    token_data: TokenData = Depends(require_permissions(["trips:create"])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new trip"""
    # Create new trip
    trip = Trip(
        user_id=user_id,
        company_id=tenant_id,
        branch=trip_data.branch,  # Contains branch UUID
        truck_plate=trip_data.truck_plate,
        truck_model=trip_data.truck_model,
        truck_capacity=trip_data.truck_capacity,
        driver_id=trip_data.driver_id,
        driver_name=trip_data.driver_name,
        driver_phone=trip_data.driver_phone,
        status=trip_data.status,
        origin=trip_data.origin,
        destination=trip_data.destination,
        distance=trip_data.distance,
        estimated_duration=trip_data.estimated_duration,
        pre_trip_time=trip_data.pre_trip_time,
        post_trip_time=trip_data.post_trip_time,
        capacity_total=trip_data.capacity_total,
        trip_date=trip_data.trip_date
    )

    db.add(trip)
    await db.commit()
    await db.refresh(trip)

    return TripResponse(
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


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: str,
    trip_data: TripUpdate,
    token_data: TokenData = Depends(require_permissions(["trips:update"])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update trip"""
    # Get existing trip
    query = select(Trip).where(
        and_(
            Trip.id == trip_id,
            Trip.company_id == tenant_id
        )
    )
    result = await db.execute(query)
    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Update trip fields
    update_data = trip_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trip, field, value)

    await db.commit()
    await db.refresh(trip)

    # Fetch orders for this trip to avoid lazy loading issues
    orders_query = select(TripOrder).where(
        TripOrder.trip_id == trip_id).order_by(TripOrder.sequence_number)

    orders_result = await db.execute(orders_query)
    orders = orders_result.scalars().all()

    # Manually construct TripResponse to avoid lazy loading serialization issues
    trip_response = {
        "id": trip.id,
        "user_id": trip.user_id,
        "company_id": trip.company_id,
        "branch": trip.branch,
        "truck_plate": trip.truck_plate,
        "truck_model": trip.truck_model,
        "truck_capacity": trip.truck_capacity,
        "driver_id": trip.driver_id,
        "driver_name": trip.driver_name,
        "driver_phone": trip.driver_phone,
        "status": trip.status,
        "origin": trip.origin,
        "destination": trip.destination,
        "distance": trip.distance,
        "estimated_duration": trip.estimated_duration,
        "pre_trip_time": trip.pre_trip_time,
        "post_trip_time": trip.post_trip_time,
        "capacity_used": trip.capacity_used,
        "capacity_total": trip.capacity_total,
        "trip_date": trip.trip_date,
        "created_at": trip.created_at,
        "updated_at": trip.updated_at,
        "orders": [
            {
                "id": order.id,
                "trip_id": order.trip_id,
                "user_id": order.user_id,
                "company_id": order.company_id,
                "order_id": order.order_id,
                "customer": order.customer,
                "customer_address": order.customer_address,
                "customer_contact": order.customer_contact,
                "customer_phone": order.customer_phone,
                "product_name": order.product_name,
                "status": order.status,
                "total": order.total,
                "weight": order.weight,
                "volume": order.volume,
                "items": order.items,
                "quantity": order.quantity or 1,  # Default to 1 if null
                "priority": order.priority,
                "delivery_status": order.delivery_status or "pending",
                "sequence_number": order.sequence_number or 0,
                "address": order.address,
                "special_instructions": order.special_instructions,
                "delivery_instructions": order.delivery_instructions,
                "original_order_id": order.original_order_id,
                "original_items": order.original_items,
                "original_weight": order.original_weight,
                "assigned_at": order.assigned_at
            } for order in orders
        ]
    }

    return trip_response


@router.delete("/{trip_id}")
async def delete_trip(
    trip_id: str,
    token_data: TokenData = Depends(require_permissions(["trips:delete"])),
    tenant_id: str = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete trip"""
    # Get existing trip
    query = select(Trip).where(
        and_(
            Trip.id == trip_id,
            Trip.company_id == tenant_id
        )
    )
    result = await db.execute(query)
    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Delete trip (orders will be deleted via cascade)
    await db.delete(trip)
    await db.commit()

    return {"message": "Trip deleted successfully"}


@router.get("/{trip_id}/orders", response_model=List[TripOrderResponse])
async def get_trip_orders(
    trip_id: str,
    token_data: TokenData = Depends(
        require_any_permission(["trips:read_all", "trips:read"])
    ),
    tenant_id: str = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Get all orders for a specific trip"""
    # First verify trip exists and belongs to tenant
    trip_query = select(Trip).where(
        and_(
            Trip.id == trip_id,
            Trip.company_id == tenant_id
        )
    )
    trip_result = await db.execute(trip_query)
    if not trip_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Trip not found")

    # Get orders (also filter by user_id and company_id if provided) ordered by sequence_number
    orders_query = select(TripOrder).where(TripOrder.trip_id == trip_id)
    if user_id:
        orders_query = orders_query.where(TripOrder.user_id == user_id)
    if company_id:
        orders_query = orders_query.where(TripOrder.company_id == company_id)

    orders_query = orders_query.order_by(TripOrder.sequence_number)
    result = await db.execute(orders_query)
    orders = result.scalars().all()

    return orders


@router.post("/{trip_id}/orders", response_model=MessageResponse)
async def assign_orders_to_trip(
    trip_id: str,
    request: Request,
    order_request: AssignOrdersRequest,
    token_data: TokenData = Depends(require_permissions(["trips:assign"])),
    tenant_id: str = Depends(get_current_tenant_id),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Assign orders to a trip"""
    # Get the authorization header for forwarding to Orders service
    auth_header = request.headers.get("authorization")
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header
    # Verify trip exists and belongs to tenant
    trip_query = select(Trip).where(
        and_(
            Trip.id == trip_id,
            Trip.company_id == tenant_id
        )
    )
    trip_result = await db.execute(trip_query)
    trip = trip_result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.status != "planning":
        raise HTTPException(
            status_code=400,
            detail="Can only assign orders to trips in planning status"
        )

    # Calculate total weight for new orders
    total_new_weight = sum(order.weight for order in order_request.orders)
    new_capacity_used = (trip.capacity_used or 0) + total_new_weight

    # Check capacity
    if new_capacity_used > trip.capacity_total:
        raise HTTPException(
            status_code=400,
            detail=f"Orders exceed trip capacity. Current: {trip.capacity_used}kg, New: {total_new_weight}kg, Max: {trip.capacity_total}kg"
        )

    # Check if any orders are already assigned to another trip (not split orders)
    for order_data in order_request.orders:
        if not order_data.original_order_id:  # Only check non-split orders
            existing_query = select(TripOrder).where(
                and_(
                    TripOrder.order_id == order_data.order_id,
                    TripOrder.tms_order_status == "fully_assigned",
                    TripOrder.trip_id != trip_id  # Exclude current trip
                )
            )
            existing_result = await db.execute(existing_query)
            existing = existing_result.scalar_one_or_none()
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Order {order_data.order_id} is already assigned to trip {existing.trip_id} and cannot be reassigned"
                )

    # Get the current highest sequence number for this trip
    max_seq_query = select(TripOrder.sequence_number).where(
        TripOrder.trip_id == trip_id).order_by(TripOrder.sequence_number.desc()).limit(1)
    max_seq_result = await db.execute(max_seq_query)
    max_seq = max_seq_result.scalar() or -1

    # Add orders to trip with sequential sequence numbers
    created_orders = []

    for idx, order_data in enumerate(order_request.orders):
        # Get order data dict without user_id, company_id, and json fields to avoid conflicts
        # Use model_dump(mode='json') to properly serialize enum values to strings
        order_dict = order_data.model_dump(mode='json', exclude={'user_id', 'company_id', 'items_json', 'remaining_items_json'})

        # Determine TMS order status based on whether this is a split order
        tms_status = "available"
        if order_data.original_order_id:
            # This is a split order - check if there are remaining items
            if order_data.remaining_items_json and len(order_data.remaining_items_json) > 0:
                tms_status = "partial"
            else:
                tms_status = "fully_assigned"
        elif order_data.items_json and len(order_data.items_json) < (order_data.original_items or order_data.items):
            # Partial assignment
            tms_status = "partial"
        else:
            # Full assignment
            tms_status = "fully_assigned"

        trip_order = TripOrder(
            trip_id=trip_id,
            sequence_number=max_seq + idx + 1,  # Assign sequential sequence numbers
            user_id=user_id,
            company_id=tenant_id,  # Use tenant_id as company_id for multi-tenancy
            tms_order_status=tms_status,
            items_json=order_data.items_json,  # Only store assigned items in trip_orders
            **order_dict
        )
        created_orders.append(trip_order)
        db.add(trip_order)

        # Update order status in Orders service for non-split orders
        if not order_data.original_order_id:
            try:
                # Update the order's tms_order_status, items_json, and remaining_items_json via Orders service
                async with AsyncClient(timeout=10.0) as client:
                    update_response = await client.patch(
                        f"{settings.ORDERS_SERVICE_URL}/api/v1/orders/tms-status",
                        headers=headers,
                        json={
                            "order_id": order_data.order_id,
                            "tms_order_status": tms_status,
                            "items_json": order_data.items_json,
                            "remaining_items_json": order_data.remaining_items_json
                        }
                    )
                    if update_response.status_code != 200:
                        logger.error(f"Failed to update TMS status for order {order_data.order_id}: {update_response.text}")
                        logger.error(f"Response status: {update_response.status_code}")
                    else:
                        logger.info(f"Successfully updated order {order_data.order_id} to tms_status={tms_status}")
            except Exception as e:
                logger.error(f"Error updating TMS status for order {order_data.order_id}: {str(e)}", exc_info=True)
                # Don't fail the assignment if status update fails

    # Update trip capacity_used
    total_weight = sum(order.weight for order in created_orders)
    trip.capacity_used = (trip.capacity_used or 0) + total_weight
    db.add(trip)

    await db.commit()

    return MessageResponse(message=f"Successfully assigned {len(order_request.orders)} orders to trip {trip_id}")


@router.put("/{trip_id}/orders/reorder", response_model=MessageResponse)
async def reorder_trip_orders(
    trip_id: str,
    request: ReorderOrdersRequest,
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    company_id: Optional[str] = Query(
        None, description="Filter by company ID"),
    token_data: TokenData = Depends(require_permissions(["trips:update"])),
    tenant_id: str = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Reorder the sequence of orders in a trip"""
    # Verify trip exists and is in planning status
    trip_query = select(Trip).where(Trip.id == trip_id)

    # Add tenant filtering
    trip_query = trip_query.where(Trip.company_id == tenant_id)

    # Add user_id and company_id filtering if provided
    if user_id:
        trip_query = trip_query.where(Trip.user_id == user_id)
    if company_id:
        trip_query = trip_query.where(Trip.company_id == company_id)

    trip_result = await db.execute(trip_query)
    trip = trip_result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.status != "planning":
        raise HTTPException(
            status_code=400,
            detail="Can only reorder orders in trips with planning status"
        )

    # Validate all order IDs belong to this trip
    order_ids = [item["order_id"] for item in request.order_sequences]

    # Check if all orders exist and belong to this trip
    existing_orders_query = select(TripOrder).where(
        and_(
            TripOrder.id.in_(order_ids),
            TripOrder.trip_id == trip_id
        )
    )
    if user_id:
        existing_orders_query = existing_orders_query.where(
            TripOrder.user_id == user_id)
    if company_id:
        existing_orders_query = existing_orders_query.where(
            TripOrder.company_id == company_id)

    existing_orders_result = await db.execute(existing_orders_query)
    existing_orders = existing_orders_result.scalars().all()

    if len(existing_orders) != len(order_ids):
        raise HTTPException(
            status_code=400,
            detail="One or more orders do not exist or do not belong to this trip"
        )

    # Update sequence numbers
    for item in request.order_sequences:
        order_id = item["order_id"]
        sequence_number = item["sequence_number"]

        update_query = update(TripOrder).where(
            and_(
                TripOrder.id == order_id,
                TripOrder.trip_id == trip_id
            )
        ).values(sequence_number=sequence_number)

        if user_id:
            update_query = update_query.where(TripOrder.user_id == user_id)
        if company_id:
            update_query = update_query.where(
                TripOrder.company_id == company_id)

        await db.execute(update_query)

    await db.commit()

    return MessageResponse(message=f"Successfully reordered {len(request.order_sequences)} orders in trip {trip_id}")


@router.delete("/{trip_id}/orders/remove", response_model=MessageResponse)
async def remove_order_from_trip(
    trip_id: str,
    order_id: str = Query(..., description="Order ID to remove"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    company_id: Optional[str] = Query(
        None, description="Filter by company ID"),
    token_data: TokenData = Depends(require_permissions(["trips:update"])),
    tenant_id: str = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """Remove an order from a trip"""
    # Verify trip exists and is in planning status
    trip_query = select(Trip).where(Trip.id == trip_id)

    # Add tenant filtering
    trip_query = trip_query.where(Trip.company_id == tenant_id)

    # Add user_id and company_id filtering if provided
    if user_id:
        trip_query = trip_query.where(Trip.user_id == user_id)
    if company_id:
        trip_query = trip_query.where(Trip.company_id == company_id)

    trip_result = await db.execute(trip_query)
    trip = trip_result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.status != "planning":
        raise HTTPException(
            status_code=400,
            detail="Can only remove orders from trips with planning status"
        )

    # Find the order to remove
    order_query = select(TripOrder).where(
        and_(
            TripOrder.trip_id == trip_id,
            TripOrder.order_id == order_id
        )
    )
    if user_id:
        order_query = order_query.where(TripOrder.user_id == user_id)
    if company_id:
        order_query = order_query.where(TripOrder.company_id == company_id)

    order_result = await db.execute(order_query)
    order = order_result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found in this trip"
        )

    # Store the weight for capacity update
    removed_weight = order.weight

    # Delete the order
    await db.delete(order)
    await db.commit()

    # Update trip capacity
    if trip.capacity_used is not None:
        trip.capacity_used = max(0, trip.capacity_used - removed_weight)
        await db.commit()

    return MessageResponse(message=f"Successfully removed order {order_id} from trip {trip_id}")
