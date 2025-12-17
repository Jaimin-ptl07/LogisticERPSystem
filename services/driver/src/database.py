"""Database configuration and models for Driver Service."""

from datetime import datetime, date
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Text,
    ForeignKey, DECIMAL, CheckConstraint
)
from sqlalchemy.orm import relationship
from src.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

# Create session factory
async_session_maker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Base class for models
Base = declarative_base()


# Trip Model (reference to TMS database)
class Trip(Base):
    """Trip model representing driver assignments."""
    __tablename__ = "trips"

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), nullable=False)
    company_id = Column(String(50), nullable=False)
    branch = Column(String(100), nullable=False)
    truck_plate = Column(String(20), nullable=False)
    truck_model = Column(String(100), nullable=False)
    truck_capacity = Column(Integer, nullable=False)
    driver_id = Column(String(50), nullable=False)
    driver_name = Column(String(100), nullable=False)
    driver_phone = Column(String(20), nullable=False)
    status = Column(
        String(50),
        CheckConstraint("status IN ('planning', 'loading', 'on-route', 'completed', 'cancelled', 'truck-malfunction')", name="check_trip_status"),
        nullable=False,
        default="planning"
    )
    origin = Column(String(100))
    destination = Column(String(100))
    distance = Column(Integer)
    estimated_duration = Column(Integer)
    pre_trip_time = Column(Integer, default=30)
    post_trip_time = Column(Integer, default=15)
    capacity_used = Column(Integer, default=0)
    capacity_total = Column(Integer, nullable=False)
    trip_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship with trip orders
    orders = relationship("TripOrder", back_populates="trip", cascade="all, delete-orphan")


# Trip Order Model (reference to TMS database)
class TripOrder(Base):
    """Trip order model representing orders assigned to trips."""
    __tablename__ = "trip_orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trip_id = Column(String(50), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(50), nullable=False)
    company_id = Column(String(50), nullable=False)
    order_id = Column(String(50), nullable=False)
    customer = Column(String(200), nullable=False)
    customer_address = Column(Text)
    status = Column(
        String(50),
        CheckConstraint("status IN ('assigned', 'loading', 'on-route', 'completed')", name="check_trip_order_status"),
        nullable=False,
        default="assigned"
    )
    delivery_status = Column(
        String(50),
        CheckConstraint("delivery_status IN ('pending', 'out-for-delivery', 'delivered', 'failed', 'returned')", name="check_delivery_status"),
        default="pending"
    )
    total = Column(DECIMAL(12, 2), nullable=False)
    weight = Column(Integer, nullable=False)
    volume = Column(Integer, nullable=False)
    items = Column(Integer, nullable=False)
    priority = Column(
        String(20),
        CheckConstraint("priority IN ('high', 'medium', 'low')", name="check_priority"),
        nullable=False
    )
    sequence_number = Column(Integer, nullable=False, default=0)
    address = Column(Text)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    original_order_id = Column(String(50))
    original_items = Column(Integer)
    original_weight = Column(Integer)

    # Relationship with trip
    trip = relationship("Trip", back_populates="orders")


# Database dependency
async def get_db() -> AsyncSession:
    """Get async database session."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


# Initialize database tables
async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)