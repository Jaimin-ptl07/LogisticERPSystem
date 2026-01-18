"""
Alembic Environment Configuration for Company Service

This configuration supports async SQLAlchemy 2.0 with asyncpg driver.

CRITICAL: This file MUST NOT import runtime application config.
It reads DATABASE_URL directly from environment variables only.
"""
import asyncio
import os
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

# Add the parent directory to the path to import models
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

# Import ONLY the Base and models - NO config classes
from src.database import Base

# Import all models so they're registered with SQLAlchemy
# Import database module to ensure all models are loaded
import src.database as db_module

# Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the database URL from environment
target_metadata = Base.metadata


def get_database_url() -> str:
    """
    Get the database URL from environment variables.

    CRITICAL: Do NOT import application config classes.
    Read directly from os.environ for consistency.
    """
    # Try Pattern 2 first: Full DATABASE_URL
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        # Ensure asyncpg driver
        if database_url.startswith("postgresql://"):
            database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
        return database_url

    # Fall back to Pattern 1: Individual components
    postgres_user = os.getenv("POSTGRES_USER", "postgres")
    postgres_password = os.getenv("POSTGRES_PASSWORD", "postgres")
    postgres_host = os.getenv("POSTGRES_HOST", "localhost")
    postgres_port = os.getenv("POSTGRES_PORT", "5432")

    # Service-specific database name for company service
    db_name = os.getenv("POSTGRES_COMPANY_DB", "company_db")

    return (
        f"postgresql+asyncpg://{postgres_user}:{postgres_password}@"
        f"{postgres_host}:{postgres_port}/{db_name}"
    )


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well. By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,  # Enable batch mode for better SQLite compatibility
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with the given connection"""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        render_as_batch=True,  # Enable batch mode
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in async mode"""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_database_url()

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
