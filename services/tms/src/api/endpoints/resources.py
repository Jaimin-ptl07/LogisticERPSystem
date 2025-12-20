"""Resources API endpoints with authentication"""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional

from src.schemas import Truck, Driver, Order, Branch
from src.security import (
    TokenData,
    require_any_permission,
    get_current_tenant_id
)

router = APIRouter()

# Dummy data - in production, this would come from other services
# Note: These should be filtered by tenant_id in a real implementation
TRUCKS = [
    Truck(id="TRK-001", plate="ABC-1234", model="Ford Transit", capacity=2000, status="available"),
    Truck(id="TRK-002", plate="XYZ-5678", model="Mercedes Sprinter", capacity=3000, status="available"),
    Truck(id="TRK-003", plate="DEF-9012", model="Iveco Daily", capacity=5000, status="available"),
    Truck(id="TRK-004", plate="GHI-3456", model="Isuzu NPR", capacity=2500, status="available"),
    Truck(id="TRK-005", plate="JKL-7890", model="Ford Transit", capacity=2000, status="available"),
]

DRIVERS = [
    Driver(id="DRV-001", name="Mike Johnson", phone="+201234567890", license="DL-001234", experience="5 years", status="active"),
    Driver(id="DRV-002", name="Sarah Ahmed", phone="+201112223333", license="DL-002345", experience="3 years", status="active"),
    Driver(id="DRV-003", name="Ali Hassan", phone="+201445556666", license="DL-003456", experience="7 years", status="active"),
    Driver(id="DRV-004", name="Mohamed Ali", phone="+201556667778", license="DL-004567", experience="4 years", status="active"),
]

ORDERS = [
    Order(
        id="ORD-001",
        customer="John's Farm",
        customerAddress="123 Farm Road, Rural Area, Cairo",
        status="approved",
        total=2500,
        weight=850,
        volume=1200,
        date=date(2024, 1, 15),
        priority="high",
        items=15,
        address="123 Farm Road, Rural Area, Cairo"
    ),
    Order(
        id="ORD-002",
        customer="Green Valley Store",
        customerAddress="456 Market St, City Center",
        status="approved",
        total=1800,
        weight=650,
        volume=950,
        date=date(2024, 1, 16),
        priority="medium",
        items=8,
        address="456 Market St, City Center"
    ),
    Order(
        id="ORD-003",
        customer="Tech Solutions Ltd",
        customerAddress="789 Tech Park Avenue, Innovation District",
        status="pending",
        total=3200,
        weight=1200,
        volume=1800,
        date=date(2024, 1, 17),
        priority="high",
        items=25,
        address="789 Tech Park Avenue, Innovation District"
    ),
    Order(
        id="ORD-004",
        customer="Fresh Foods Market",
        customerAddress="101 Fresh Street, Downtown",
        status="approved",
        total=950,
        weight=400,
        volume=500,
        date=date(2024, 1, 18),
        priority="low",
        items=6,
        address="101 Fresh Street, Downtown"
    ),
]

BRANCHES = [
    Branch(id="BRN-001", code="CAI-001", name="Cairo Central", location="123 Main St, Cairo", manager="Ahmed Mohamed", phone="+201234567890", status="active"),
    Branch(id="BRN-002", code="ALX-001", name="Alexandria", location="456 Port Said Rd, Alexandria", manager="Sara Ali", phone="+201987654321", status="active"),
    Branch(id="BRN-003", code="GIZ-001", name="Giza Branch", location="789 Pyramid Ave, Giza", manager="Mahmoud Hassan", phone="+201654321098", status="active"),
]


@router.get("/trucks", response_model=List[Truck])
async def get_trucks(
    status: Optional[str] = Query(None, description="Filter by truck status"),
    token_data: TokenData = Depends(
        require_any_permission(["resources:read", "resources:read_all", "vehicles:read", "vehicles:read_all", "vehicles:track", "vehicles:update"])
    ),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Get all trucks with optional status filter"""
    # In production, filter by tenant_id
    trucks = TRUCKS

    # Filter by status if provided
    if status:
        trucks = [truck for truck in trucks if truck.status == status]

    return trucks


@router.get("/drivers", response_model=List[Driver])
async def get_drivers(
    status: Optional[str] = Query(None, description="Filter by driver status"),
    token_data: TokenData = Depends(
        require_any_permission(["resources:read", "resources:read_all", "drivers:read", "drivers:read_all", "drivers:update"])
    ),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Get all drivers with optional status filter"""
    # In production, filter by tenant_id
    drivers = DRIVERS

    # Filter by status if provided
    if status:
        drivers = [driver for driver in drivers if driver.status == status]

    return drivers


@router.get("/orders", response_model=List[Order])
async def get_orders(
    status: Optional[str] = Query(None, description="Filter by order status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    token_data: TokenData = Depends(
        require_any_permission(["resources:read", "resources:read_all", "orders:read", "orders:read_all"])
    ),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Get all orders with optional filters"""
    # In production, filter by tenant_id
    orders = ORDERS

    # Apply filters
    if status:
        orders = [order for order in orders if order.status == status]
    if priority:
        orders = [order for order in orders if order.priority == priority]

    return orders


@router.get("/branches", response_model=List[Branch])
async def get_branches(
    token_data: TokenData = Depends(
        require_any_permission(["resources:read", "resources:read_all", "branches:read", "branches:read_all"])
    ),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Get all branches"""
    # In production, filter by tenant_id
    return BRANCHES