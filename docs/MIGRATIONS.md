# Database Migrations Guide

This guide covers how to work with Alembic database migrations in the LogisticERPSystem.

## Table of Contents

- [Overview](#overview)
- [Automatic Migration Behavior](#automatic-migration-behavior)
- [Development Workflow](#development-workflow)
- [Common Scenarios](#common-scenarios)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [Quick Reference](#quick-reference)

## Overview

Each service has its own database and migration system:

| Service | Database | Migration Job |
|---------|----------|---------------|
| auth-service | `auth_db` | `auth-service-migration` |
| company-service | `company_db` | `company-service-migration` |
| orders-service | `orders_db` | `orders-service-migration` |
| tms-service | `tms_db` | `tms-service-migration` |
| finance-service | `finance_db` | `finance-service-migration` |
| notification-service | `notification_db` | `notification-service-migration` |

## Automatic Migration Behavior

### Do Migrations Run Automatically?

**YES**. When you run `docker-compose up -d` (after removing volumes), migrations run automatically.

**How it works:**

1. Each `*-service-migration` job has `restart: "no"`
2. They start when docker-compose starts
3. They run the migration and exit
4. Application services depend on postgres being healthy first

### Removing Volumes and Starting Fresh

```bash
# Stop and remove all volumes (deletes all data)
docker-compose down -v

# Start everything (migrations run automatically)
docker-compose up -d
```

**Result**: All databases are recreated from scratch, and all migrations run from the beginning.

## Development Workflow

### Step 1: Create a New Migration

```bash
# Navigate to the service's migrations directory
cd services/[service-name]/migrations

# Create a new migration using autogenerate
alembic revision --autogenerate -m "description_of_changes"

# OR create an empty migration for manual SQL
alembic revision -m "description_of_changes"
```

### Step 2: Review and Edit the Migration

The migration file is created in `versions/` with format: `YYYYMMDD_HHMM_{hash}_description_of_changes.py`

**Important**: Always review auto-generated migrations before committing!

### Step 3: Test the Migration

```bash
# Check current migration status
alembic current

# See migration history
alembic history

# Upgrade to latest
alembic upgrade head

# Verify changes in database
docker-compose exec postgres psql -U postgres -d [db_name] -c "\dt"
```

### Step 4: Deploy the Migration

**Option A: Rebuild and restart migration container**
```bash
# Rebuild the service image (if migrations are baked in)
docker-compose build [service-name]

# Force recreate the migration container
docker-compose up -d --force-recreate [service-name]-migration
```

**Option B: Run migration manually**
```bash
docker-compose run --rm [service-name]-migration
```

## Common Scenarios

### Adding a New Column

```bash
cd services/[service-name]/migrations
alembic revision --autogenerate -m "add_status_column_to_users"
```

### Creating a New Table

1. Define the model in `src/models/` (preferred) or `src/database.py`
2. Run: `alembic revision --autogenerate -m "add_new_table"`
3. Review and run migration

**Important**: For services like `notification`, models are in `src/models/notification.py` to avoid importing config during migration generation.

### Handling Circular Dependencies

For tables with circular foreign keys (like in auth service), create tables WITHOUT FK constraints first:

```python
def upgrade() -> None:
    # Create all tables without FKs
    op.create_table('roles', ...)
    op.create_table('tenants', ...)
    op.create_table('users', ...)

    # Then add FK constraints
    op.create_foreign_key('fk_roles_tenant_id', 'roles', 'tenants', ...)
```

### Data Migrations

For data changes (not schema changes), use `op.execute()`:

```python
def upgrade() -> None:
    # Execute raw SQL
    op.execute("""
        UPDATE users
        SET status = 'active'
        WHERE status IS NULL
    """)
```

## Troubleshooting

### Migration Fails with "relation already exists"

**Cause**: Tables were created outside Alembic

**Solution**:
```bash
# Drop the problematic table
docker-compose exec postgres psql -U postgres -d [db_name] -c "DROP TABLE IF EXISTS table_name CASCADE;"

# Mark migration as complete without running it
alembic stamp head
```

### Migration is "stuck"

```bash
# Check current revision
alembic current

# Manually set the revision
alembic stamp <revision_hash>
```

### Connection Refused Error

**Cause**: PostgreSQL isn't ready yet

**Solution**: Check health status:
```bash
docker-compose ps postgres
```

### Migration File Not Found in Container

**Cause**: Volume mount not configured

**Solution**: Ensure docker-compose.yml has:
```yaml
volumes:
  - ./services/[service-name]/migrations:/app/migrations
```

And Dockerfile has:
```dockerfile
COPY migrations/ ./migrations/
```

## Best Practices

1. **Always review auto-generated migrations** - Don't blindly trust `--autogenerate`
2. **Test migrations locally first** - Before committing
3. **Use descriptive migration messages** - Helps with `alembic history`
4. **Keep migrations reversible** - Always write `downgrade()` logic
5. **Never modify existing migration files** - Create new ones instead
6. **Commit migration files with code changes** - Keep them in sync

## Quick Reference

```bash
# Create migration
alembic revision --autogenerate -m "message"

# Run migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Check status
alembic current
alembic history

# Manual mark as complete
alembic stamp head

# Reset to specific version
alembic downgrade <revision>
```

## Environment Variables

| Service | Database URL Pattern |
|---------|---------------------|
| auth | `POSTGRES_AUTH_DB=auth_db` |
| company | `POSTGRES_COMPANY_DB=company_db` |
| orders | `POSTGRES_ORDERS_DB=orders_db` |
| tms | `DATABASE_URL=postgresql+asyncpg://...` |
| finance | `DATABASE_URL=postgresql+asyncpg://...` |
| notification | `DATABASE_URL=postgresql+asyncpg://...` |

## File Structure

```
services/
├── auth/
│   ├── migrations/
│   │   ├── alembic.ini
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── YYYYMMDD_HHMM_{hash}_description.py
│   └── src/
│       └── models/
│           └── *.py
```
