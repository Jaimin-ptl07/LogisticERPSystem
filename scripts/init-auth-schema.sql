-- Auth Service Database Schema Initialization
-- This file will be executed after the database is created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    settings TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions association table
CREATE TABLE IF NOT EXISTS role_permissions (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id VARCHAR(255) NOT NULL REFERENCES roles(id),
    permission_id VARCHAR(255) NOT NULL REFERENCES permissions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id),
    role_id VARCHAR(255) NOT NULL REFERENCES roles(id)
);

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id);

-- Create function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to update updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default tenant
INSERT INTO tenants (id, name, domain, is_active)
VALUES ('default-tenant', 'Default Organization', 'demo.logistics-erp.com', true)
ON CONFLICT (id) DO NOTHING;

-- Insert default roles
INSERT INTO roles (id, name, description, tenant_id, is_system) VALUES
    ('super-admin-role', 'Super Admin', 'System administrator with all privileges', 'default-tenant', true),
    ('admin-role', 'Admin', 'Organization administrator', 'default-tenant', true),
    ('manager-role', 'Manager', 'Operations manager', 'default-tenant', false),
    ('user-role', 'User', 'Regular user', 'default-tenant', false)
ON CONFLICT (id) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('users', 'create', 'Create new users'),
    ('users', 'read', 'View user information'),
    ('users', 'update', 'Update user information'),
    ('users', 'delete', 'Delete users'),
    ('tenants', 'create', 'Create new tenants'),
    ('tenants', 'read', 'View tenant information'),
    ('tenants', 'update', 'Update tenant information'),
    ('tenants', 'delete', 'Delete tenants'),
    ('roles', 'create', 'Create new roles'),
    ('roles', 'read', 'View role information'),
    ('roles', 'update', 'Update role information'),
    ('roles', 'delete', 'Delete roles'),
    ('orders', 'create', 'Create new orders'),
    ('orders', 'read', 'View order information'),
    ('orders', 'update', 'Update order information'),
    ('orders', 'delete', 'Delete orders'),
    ('wms', 'create', 'Create warehouse entries'),
    ('wms', 'read', 'View warehouse information'),
    ('wms', 'update', 'Update warehouse information'),
    ('wms', 'delete', 'Delete warehouse entries'),
    ('tms', 'create', 'Create transportation entries'),
    ('tms', 'read', 'View transportation information'),
    ('tms', 'update', 'Update transportation information'),
    ('tms', 'delete', 'Delete transportation entries'),
    ('billing', 'create', 'Create billing entries'),
    ('billing', 'read', 'View billing information'),
    ('billing', 'update', 'Update billing information'),
    ('billing', 'delete', 'Delete billing entries')
ON CONFLICT DO NOTHING;

-- Assign all permissions to super admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'super-admin-role', id FROM permissions
ON CONFLICT DO NOTHING;

-- Assign basic permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'admin-role', id FROM permissions
WHERE resource IN ('users', 'read', 'roles', 'read', 'orders', 'read', 'wms', 'read', 'tms', 'read', 'billing', 'read')
ON CONFLICT DO NOTHING;