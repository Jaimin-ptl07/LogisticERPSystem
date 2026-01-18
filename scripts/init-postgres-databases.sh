#!/bin/bash
set -e

# Create all required databases for the Logistics ERP system
echo "Creating databases..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create core databases ONLY
    -- Schema initialization is now handled by Alembic migrations per service
    CREATE DATABASE auth_db;
    CREATE DATABASE company_db;
    CREATE DATABASE orders_db;
    CREATE DATABASE wms_db;
    CREATE DATABASE tms_db;
    CREATE DATABASE billing_db;
    CREATE DATABASE finance_db;
    CREATE DATABASE telemetry_db;
    CREATE DATABASE notification_db;

    -- Grant permissions
    GRANT ALL PRIVILEGES ON DATABASE auth_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE company_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE orders_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE wms_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE tms_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE billing_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE finance_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE telemetry_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE notification_db TO $POSTGRES_USER;
EOSQL

echo "Database creation complete!"
echo "Schema initialization will be handled by Alembic migrations per service."
