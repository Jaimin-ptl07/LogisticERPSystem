"""
Database configuration for notification service.

Models are imported from src.models to avoid importing
application config during migration generation.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from src.config import get_settings

settings = get_settings()

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True
)

# Create session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


def get_async_session_maker():
    """
    Create a new session maker bound to the current event loop.

    This is useful for background tasks (like Kafka consumer) that run
    in a separate event loop from the main FastAPI app.
    """
    from sqlalchemy.ext.asyncio import create_async_engine
    from src.config import get_settings
    settings = get_settings()

    # Create a new engine for this event loop
    loop_engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        future=True
    )

    return async_sessionmaker(
        loop_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )


async def get_db() -> AsyncSession:
    """Get database session"""
    async with async_session_maker() as session:
        yield session


async def init_db():
    """
    Initialize database using Alembic migrations.

    This function runs Alembic migrations to create/update database schema.
    It should be called during application startup.
    """
    import subprocess
    import sys
    import os

    # Change to migrations directory
    migrations_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "migrations")
    original_dir = os.getcwd()

    if not os.path.exists(migrations_dir):
        raise FileNotFoundError(f"Migrations directory not found: {migrations_dir}")

    os.chdir(migrations_dir)

    try:
        # Run Alembic migrations
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"Migration failed: {result.stderr}")
            raise RuntimeError(f"Database migration failed: {result.stderr}")
        print(f"Migration successful: {result.stdout}")
    finally:
        os.chdir(original_dir)


async def get_db_context():
    """Context manager for database session - useful for scheduler and background tasks"""
    async with async_session_maker() as session:
        yield session


# Import models for use in the application
# This is done after engine/session creation to avoid circular imports
from src.models.notification import (
    Notification,
    UserNotificationPreference,
    ScheduledNotification,
    NotificationDeliveryLog,
    Base
)

__all__ = [
    "Notification",
    "UserNotificationPreference",
    "ScheduledNotification",
    "NotificationDeliveryLog",
    "Base",
    "engine",
    "async_session_maker",
    "get_db",
    "init_db",
    "get_db_context",
]
