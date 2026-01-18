"""
Database configuration for Orders Service
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Integer, Numeric, UUID, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.config_local import OrdersSettings

settings = OrdersSettings()

# Create async engine
engine = create_async_engine(
    settings.get_database_url(settings.POSTGRES_ORDERS_DB),
    echo=settings.LOG_LEVEL.lower() == "debug",
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=20,
    max_overflow=30,
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()

# Import ALL models so they're registered with SQLAlchemy
# This is CRITICAL for Alembic autogenerate to work
from src.models.order import Order
from src.models.order_item import OrderItem
from src.models.order_document import OrderDocument, DocumentType
from src.models.order_status_history import OrderStatusHistory

# Import enums for use in models
from src.models.order import OrderStatus, OrderType, PaymentType

# Dependency to get DB session


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
