"""
Migration script for User Role Management tables
Run this script to apply the user role management database changes
"""
import asyncio
import sys
from pathlib import Path

# Add src to path for imports
sys.path.append(str(Path(__file__).parent.parent / "src"))

from src.config_local import CompanySettings
import asyncpg


async def run_user_role_migration():
    """
    Apply user role management migration to company database
    """
    settings = CompanySettings()
    company_url = settings.get_database_url(settings.POSTGRES_COMPANY_DB)

    print(f"Applying User Role Management migration to: {settings.POSTGRES_COMPANY_DB}")

    # Connect to company database
    conn = await asyncpg.connect(company_url)

    try:
        # Read and execute migration file
        migration_path = Path(__file__).parent / "002_user_role_management.sql"
        if migration_path.exists():
            print(f"Executing migration: {migration_path.name}")
            with open(migration_path, 'r') as f:
                migration_sql = f.read()

            await conn.execute(migration_sql)
            print("✅ User Role Management tables created successfully")
        else:
            print(f"❌ Migration file not found: {migration_path}")
            return

        # Read and execute default roles file
        roles_path = Path(__file__).parent / "003_default_company_roles.sql"
        if roles_path.exists():
            print(f"Executing roles insert: {roles_path.name}")
            with open(roles_path, 'r') as f:
                roles_sql = f.read()

            await conn.execute(roles_sql)
            print("✅ Default company roles inserted successfully")
        else:
            print(f"❌ Default roles file not found: {roles_path}")
            return

        # Verify tables were created
        tables = await conn.fetch(
            """
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename IN (
                'company_roles',
                'user_invitations',
                'employee_profiles',
                'driver_profiles',
                'finance_manager_profiles',
                'branch_manager_profiles',
                'logistics_manager_profiles',
                'employee_documents'
            )
            ORDER BY tablename
            """
        )

        print("\n✅ Created/Verified tables:")
        for table in tables:
            print(f"  - {table['tablename']}")

        # Verify default roles were inserted
        roles = await conn.fetch(
            """
            SELECT role_name, display_name
            FROM company_roles
            WHERE tenant_id = 'default-tenant'
            AND is_system_role = true
            ORDER BY role_name
            """
        )

        print("\n✅ Default roles created:")
        for role in roles:
            print(f"  - {role['role_name']} ({role['display_name']})")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        await conn.close()

    print(f"\n✅ User Role Management migration completed successfully!")


async def check_migration():
    """
    Check if user role management migration has been applied
    """
    settings = CompanySettings()
    company_url = settings.get_database_url(settings.POSTGRES_COMPANY_DB)

    try:
        conn = await asyncpg.connect(company_url)

        # Check if tables exist
        tables = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = 'company_roles'
            """
        )

        if tables > 0:
            print(f"✅ User Role Management migration has been applied to {settings.POSTGRES_COMPANY_DB}")

            # Show role count
            role_count = await conn.fetchval(
                "SELECT COUNT(*) FROM company_roles WHERE tenant_id = 'default-tenant'"
            )
            print(f"   Found {role_count} roles for default tenant")
        else:
            print(f"❌ User Role Management migration not found in {settings.POSTGRES_COMPANY_DB}")

        await conn.close()
        return tables > 0

    except Exception as e:
        print(f"❌ Check failed: {e}")
        return False


async def rollback_migration():
    """
    Rollback user role management migration (for development/testing only)
    """
    settings = CompanySettings()
    company_url = settings.get_database_url(settings.POSTGRES_COMPANY_DB)

    print(f"\n⚠️  WARNING: Rolling back User Role Management migration from: {settings.POSTGRES_COMPANY_DB}")
    print("This will DELETE all user role management data!")

    # Confirm before proceeding
    confirm = input("Type 'yes' to confirm rollback: ")
    if confirm.lower() != 'yes':
        print("Rollback cancelled")
        return

    conn = await asyncpg.connect(company_url)

    try:
        # Drop tables in correct order (considering foreign keys)
        tables_to_drop = [
            'employee_documents',
            'logistics_manager_profiles',
            'branch_manager_profiles',
            'finance_manager_profiles',
            'driver_profiles',
            'user_invitations',
            'employee_profiles',
            'company_roles'
        ]

        for table in tables_to_drop:
            print(f"Dropping table: {table}")
            await conn.execute(f"DROP TABLE IF EXISTS {table} CASCADE")

        print("✅ Migration rollback completed")

    except Exception as e:
        print(f"❌ Rollback failed: {e}")
        raise
    finally:
        await conn.close()


async def main():
    """
    Main migration function with command line options
    """
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()

        if command == "--check":
            await check_migration()
        elif command == "--rollback":
            await rollback_migration()
        else:
            print("Usage:")
            print("  python run_user_role_migration.py          # Run migration")
            print("  python run_user_role_migration.py --check   # Check if migration applied")
            print("  python run_user_role_migration.py --rollback  # Rollback migration")
    else:
        await run_user_role_migration()


if __name__ == "__main__":
    asyncio.run(main())