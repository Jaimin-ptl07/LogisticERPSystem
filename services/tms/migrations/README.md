# Alembic Migrations for Tms Service

This directory contains Alembic database migrations for the tms service.

## Directory Structure

- `alembic.ini` - Alembic configuration file
- `env.py` - Alembic environment setup (async SQLAlchemy 2.0 compatible)
- `script.py.mako` - Template for new migration files
- `versions/` - Migration version files

## Database Configuration

The migrations use the following environment variables:
- `POSTGRES_USER` - Database user (default: postgres)
- `POSTGRES_PASSWORD` - Database password (default: postgres)
- `POSTGRES_HOST` - Database host (default: postgres)
- `POSTGRES_PORT` - Database port (default: 5432)
- `POSTGRES_TMS_DB` - Database name for this service

## Usage

### Using the central migration manager:

```bash
# Create a new migration
python scripts/manage_migrations.py create --service tms --message "describe changes"

# Apply migrations
python scripts/manage_migrations.py upgrade --service tms

# Rollback one step
python scripts/manage_migrations.py downgrade --service tms

# Show migration history
python scripts/manage_migrations.py history --service tms
```

### Using Alembic directly:

```bash
# From this directory
alembic revision --autogenerate -m "describe changes"
alembic upgrade head
alembic downgrade -1
alembic history
```

## Initial Migration

To generate the initial migration from an existing database:

1. Make sure the database exists and has the current schema
2. Run from the project root:
   ```bash
   python scripts/generate_initial_migrations.py --service tms
   ```

## Notes

- This service uses async SQLAlchemy 2.0 with asyncpg driver
- Migrations are run in async mode
- The `--autogenerate` feature compares the current database state to the models
