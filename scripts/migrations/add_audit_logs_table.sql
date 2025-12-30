-- Migration Script: Add audit_logs table
-- Run this script on existing company databases to add the audit_logs table
-- This is part of Migration 012

-- Create audit_logs table to track all operations across the system
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    user_role VARCHAR(100),
    user_email VARCHAR(255),

    -- Entity information
    entity_type VARCHAR(50) NOT NULL,  -- order, trip, payment, customer, etc.
    entity_id VARCHAR(255) NOT NULL,    -- ID of the affected entity
    entity_name VARCHAR(500),           -- Human-readable name of the entity

    -- Action details
    action VARCHAR(100) NOT NULL,       -- created, updated, deleted, approved, rejected, etc.
    module VARCHAR(50) NOT NULL,        -- orders, finance, tms, driver, auth, company
    sub_module VARCHAR(50),              -- Specific sub-module (e.g., deliveries, approvals)

    -- Status changes
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    status_changed BOOLEAN DEFAULT FALSE,

    -- Additional details
    description TEXT,
    reason TEXT,
    notes TEXT,
    meta_data JSONB,                      -- Additional flexible data (renamed from 'metadata' - reserved in SQLAlchemy)

    -- Request context
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_id VARCHAR(100),

    -- Timestamps
    action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(action_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status_change ON audit_logs(status_changed) WHERE status_changed = TRUE;
CREATE INDEX IF NOT EXISTS idx_audit_logs_new_status ON audit_logs(new_status);

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at on audit_logs
DROP TRIGGER IF EXISTS update_audit_logs_updated_at ON audit_logs;
CREATE TRIGGER update_audit_logs_updated_at BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit log table to track all operations across the ERP system';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity affected (order, trip, payment, customer, product, etc.)';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID of the affected entity';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (created, updated, deleted, approved, rejected, submitted, etc.)';
COMMENT ON COLUMN audit_logs.module IS 'Service/module where action occurred (orders, finance, tms, driver, auth, company)';
COMMENT ON COLUMN audit_logs.old_status IS 'Previous status before the action';
COMMENT ON COLUMN audit_logs.new_status IS 'New status after the action';
COMMENT ON COLUMN audit_logs.status_changed IS 'Whether this action resulted in a status change';
COMMENT ON COLUMN audit_logs.meta_data IS 'Additional flexible data stored as JSONB';
