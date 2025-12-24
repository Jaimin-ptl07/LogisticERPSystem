-- User Role Management Migration
-- This file adds user role management tables to the company service database
-- Run this script after the initial company schema is created

-- Create company_roles table
CREATE TABLE IF NOT EXISTS company_roles (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB,  -- Store role permissions as JSON
    is_active BOOLEAN DEFAULT true,
    is_system_role BOOLEAN DEFAULT false,  -- For predefined roles
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT company_roles_tenant_role_unique UNIQUE(tenant_id, role_name)
);

-- Create user_invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    role_id VARCHAR(36) NOT NULL REFERENCES company_roles(id),
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    invited_by VARCHAR(255) NOT NULL,  -- User ID who sent the invitation
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by VARCHAR(255),  -- User ID who accepted
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create employee_profiles table
CREATE TABLE IF NOT EXISTS employee_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL UNIQUE,  -- Reference to auth service users table
    employee_code VARCHAR(20) UNIQUE,
    role_id VARCHAR(36) NOT NULL REFERENCES company_roles(id),
    branch_id UUID REFERENCES branches(id),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    blood_group VARCHAR(5),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'India',
    hire_date DATE,
    employment_type VARCHAR(20) DEFAULT 'permanent' CHECK (employment_type IN ('permanent', 'contract', 'probation')),
    department VARCHAR(50),
    designation VARCHAR(100),
    reports_to VARCHAR(36),  -- Self-reference to manager's employee profile
    salary DECIMAL(12,2),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(100),
    bank_ifsc VARCHAR(20),
    pan_number VARCHAR(20),
    aadhar_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create driver_profiles table (extends employee_profiles)
CREATE TABLE IF NOT EXISTS driver_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_profile_id VARCHAR(36) NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_type VARCHAR(20) NOT NULL CHECK (license_type IN ('light_motor', 'heavy_motor', 'transport', 'goods')),
    license_expiry DATE NOT NULL,
    license_issuing_authority VARCHAR(100),
    badge_number VARCHAR(50),
    badge_expiry DATE,
    experience_years INTEGER DEFAULT 0,
    preferred_vehicle_types JSONB,  -- Array of preferred vehicle types
    current_status VARCHAR(20) DEFAULT 'available' CHECK (current_status IN ('available', 'on_trip', 'off_duty', 'on_leave', 'suspended')),
    last_trip_date DATE,
    total_trips INTEGER DEFAULT 0,
    total_distance DECIMAL(12,2) DEFAULT 0,  -- Total kilometers driven
    average_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5),
    accident_count INTEGER DEFAULT 0,
    traffic_violations INTEGER DEFAULT 0,
    medical_fitness_certificate_date DATE,
    police_verification_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create finance_manager_profiles table (extends employee_profiles)
CREATE TABLE IF NOT EXISTS finance_manager_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_profile_id VARCHAR(36) NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    can_approve_payments BOOLEAN DEFAULT false,
    max_approval_limit DECIMAL(12,2) DEFAULT 0,
    managed_branches JSONB,  -- Array of branch IDs this manager oversees
    access_levels JSONB,  -- Define what financial modules they can access
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create branch_manager_profiles table (extends employee_profiles)
CREATE TABLE IF NOT EXISTS branch_manager_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_profile_id VARCHAR(36) NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    managed_branch_id UUID NOT NULL REFERENCES branches(id),
    can_create_quotes BOOLEAN DEFAULT true,
    can_approve_discounts BOOLEAN DEFAULT false,
    max_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    can_manage_inventory BOOLEAN DEFAULT true,
    can_manage_vehicles BOOLEAN DEFAULT false,
    staff_management_permissions JSONB,  -- Define what staff operations they can perform
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create logistics_manager_profiles table (extends employee_profiles)
CREATE TABLE IF NOT EXISTS logistics_manager_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_profile_id VARCHAR(36) NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    managed_zones JSONB,  -- Array of zones or areas they manage
    can_assign_drivers BOOLEAN DEFAULT true,
    can_approve_overtime BOOLEAN DEFAULT false,
    can_plan_routes BOOLEAN DEFAULT true,
    vehicle_management_permissions JSONB,  -- Define vehicle operations they can perform
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create employee_documents table
CREATE TABLE IF NOT EXISTS employee_documents (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    employee_profile_id VARCHAR(36) NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,  -- e.g., 'passport', 'license', 'aadhar', 'pan', 'contract', 'resume'
    document_name VARCHAR(255) NOT NULL,
    document_number VARCHAR(100),
    file_path VARCHAR(500),  -- Path to stored document
    file_url VARCHAR(500),   -- URL if stored in cloud storage
    file_size INTEGER,
    file_type VARCHAR(50),   -- e.g., 'pdf', 'jpg', 'png'
    issue_date DATE,
    expiry_date DATE,
    issuing_authority VARCHAR(100),
    is_verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(36),  -- Employee profile ID of verifier
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_roles_tenant ON company_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_company_roles_name ON company_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_user_invitations_tenant ON user_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_tenant ON employee_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_user ON employee_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_role ON employee_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_branch ON employee_profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_code ON employee_profiles(employee_code);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_employee ON driver_profiles(employee_profile_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_license ON driver_profiles(license_number);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_status ON driver_profiles(current_status);
CREATE INDEX IF NOT EXISTS idx_finance_manager_profiles_employee ON finance_manager_profiles(employee_profile_id);
CREATE INDEX IF NOT EXISTS idx_branch_manager_profiles_employee ON branch_manager_profiles(employee_profile_id);
CREATE INDEX IF NOT EXISTS idx_branch_manager_profiles_branch ON branch_manager_profiles(managed_branch_id);
CREATE INDEX IF NOT EXISTS idx_logistics_manager_profiles_employee ON logistics_manager_profiles(employee_profile_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee ON employee_documents(employee_profile_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON employee_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_employee_documents_expiry ON employee_documents(expiry_date);

-- Create triggers for updated_at
CREATE TRIGGER update_company_roles_updated_at BEFORE UPDATE ON company_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_invitations_updated_at BEFORE UPDATE ON user_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_profiles_updated_at BEFORE UPDATE ON employee_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_profiles_updated_at BEFORE UPDATE ON driver_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_manager_profiles_updated_at BEFORE UPDATE ON finance_manager_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branch_manager_profiles_updated_at BEFORE UPDATE ON branch_manager_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logistics_manager_profiles_updated_at BEFORE UPDATE ON logistics_manager_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON employee_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for new tables
ALTER TABLE company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_manager_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_manager_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_manager_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies (commented out until authentication is properly integrated)
/*
CREATE POLICY company_roles_tenant_policy ON company_roles
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id());

CREATE POLICY user_invitations_tenant_policy ON user_invitations
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id());

CREATE POLICY employee_profiles_tenant_policy ON employee_profiles
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id());

CREATE POLICY driver_profiles_tenant_policy ON driver_profiles
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id());

CREATE POLICY finance_manager_profiles_tenant_policy ON finance_manager_profiles
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id());

CREATE POLICY branch_manager_profiles_tenant_policy ON branch_manager_profiles
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id());

CREATE POLICY logistics_manager_profiles_tenant_policy ON logistics_manager_profiles
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id());

CREATE POLICY employee_documents_tenant_policy ON employee_documents
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id());
*/