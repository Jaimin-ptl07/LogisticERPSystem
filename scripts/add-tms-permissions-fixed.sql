-- Add TMS Permissions to Auth Database Schema (Fixed Version)
-- This script adds comprehensive permissions for Transportation Management System

-- Trip management permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('trips', 'read', 'Read trip information'),
    ('trips', 'read_all', 'Read all trips in tenant'),
    ('trips', 'read_own', 'Read own created trips'),
    ('trips', 'create', 'Create new trips'),
    ('trips', 'update', 'Update trip information'),
    ('trips', 'delete', 'Delete trips'),
    ('trips', 'delete_own', 'Delete own created trips'),
    ('trips', 'assign', 'Assign orders to trips'),
    ('trips', 'track', 'Track trip location and status'),
    ('trips', 'cancel', 'Cancel trips'),
    ('trips', 'complete', 'Complete trips'),
    ('trips', 'manage_all', 'Full trip management access'),
    ('trips', 'schedule', 'Schedule trips'),
    ('trips', 'route_optimize', 'Optimize trip routes');

-- Order management permissions (TMS-specific)
INSERT INTO permissions (resource, action, description) VALUES
    ('orders', 'split', 'Split orders between trips'),
    ('orders', 'reassign', 'Reassign orders to different trips'),
    ('orders', 'merge', 'Merge multiple orders'),
    ('orders', 'priority_update', 'Update order priority'),
    ('orders', 'modify', 'Modify order details');

-- Resource management permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('resources', 'read', 'Read TMS resources'),
    ('resources', 'read_all', 'Read all TMS resources'),
    ('resources', 'drivers_assign', 'Assign drivers to trips'),
    ('resources', 'vehicles_track', 'Track vehicle locations'),
    ('resources', 'vehicles_update', 'Update vehicle information'),
    ('resources', 'inventory_view', 'View inventory levels'),
    ('resources', 'fuel_manage', 'Manage fuel consumption');

-- Route management permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('routes', 'create', 'Create delivery routes'),
    ('routes', 'read', 'Read route information'),
    ('routes', 'read_all', 'Read all routes'),
    ('routes', 'update', 'Update route information'),
    ('routes', 'delete', 'Delete routes'),
    ('routes', 'optimize', 'Optimize route efficiency'),
    ('routes', 'geo_fence', 'Manage geofencing rules');

-- Schedule management permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('schedules', 'read', 'View schedules'),
    ('schedules', 'read_all', 'View all schedules'),
    ('schedules', 'create', 'Create schedules'),
    ('schedules', 'update', 'Update schedules'),
    ('schedules', 'delete', 'Delete schedules'),
    ('schedules', 'approve', 'Approve schedules'),
    ('schedules', 'publish', 'Publish schedules'),
    ('schedules', 'conflict_check', 'Check scheduling conflicts');

-- Tracking and monitoring permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('tracking', 'live', 'Live vehicle tracking'),
    ('tracking', 'history', 'View tracking history'),
    ('tracking', 'reports', 'Generate tracking reports'),
    ('tracking', 'alerts', 'Manage tracking alerts'),
    ('tracking', 'geofence', 'Manage geofence alerts'),
    ('tracking', 'eta_update', 'Update ETA predictions'),
    ('tracking', 'proof_of_delivery', 'Proof of delivery management');

-- Document management permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('documents', 'upload', 'Upload documents'),
    ('documents', 'download', 'Download documents'),
    ('documents', 'verify', 'Verify document authenticity'),
    ('documents', 'archive', 'Archive old documents'),
    ('documents', 'manage_all', 'Full document management');

-- Reporting and analytics permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('reports', 'trip', 'Generate trip reports'),
    ('reports', 'driver_performance', 'View driver performance reports'),
    ('reports', 'fleet_utilization', 'Fleet utilization reports'),
    ('reports', 'fuel_efficiency', 'Fuel efficiency reports'),
    ('reports', 'delivery_performance', 'Delivery performance reports'),
    ('reports', 'revenue', 'Revenue and profit reports'),
    ('reports', 'custom', 'Create custom reports'),
    ('reports', 'export', 'Export reports to various formats');

-- Integration permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('integration', 'customers', 'Integrate with customer service'),
    ('integration', 'orders', 'Integrate with order service'),
    ('integration', 'vehicles', 'Integrate with vehicle service'),
    ('integration', 'branches', 'Integrate with branch service'),
    ('integration', 'billing', 'Integrate with billing service'),
    ('integration', 'notifications', 'Manage system notifications');

-- Configuration permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('config', 'rules', 'Configure TMS business rules'),
    ('config', 'rates', 'Configure shipping rates'),
    ('config', 'routes', 'Configure default routes'),
    ('config', 'users', 'Manage user access'),
    ('config', 'api_keys', 'Manage API access keys'),
    ('config', 'system', 'System configuration'),
    ('config', 'backups', 'Configure backup policies');

-- Audit and compliance permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('audit', 'read', 'View audit logs'),
    ('audit', 'export', 'Export audit data'),
    ('audit', 'cleanup', 'Manage audit log retention'),
    ('compliance', 'read', 'View compliance reports'),
    ('compliance', 'export', 'Export compliance data');

-- Super Admin permissions (for multi-tenant management)
INSERT INTO permissions (resource, action, description) VALUES
    ('tms', 'multi_tenant_manage', 'Manage multiple tenants'),
    ('tms', 'super_admin', 'TMS super admin access');

-- Assign TMS permissions to roles
-- Super Admin role (role_id = 1) - Full access
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT
    1 as role_id,
    p.id as permission_id,
    NOW() as created_at
FROM permissions p
WHERE p.resource IN (
    'trips', 'orders', 'resources', 'routes', 'schedules',
    'tracking', 'documents', 'reports', 'integration',
    'config', 'audit', 'compliance', 'tms'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin role (role_id = 2) - Comprehensive access within tenant
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT
    2 as role_id,
    p.id as permission_id,
    NOW() as created_at
FROM permissions p
WHERE p.resource IN (
    'trips', 'orders', 'resources', 'routes', 'schedules',
    'tracking', 'documents', 'reports', 'integration', 'config'
)
AND p.action NOT IN ('delete', 'multi_tenant_manage', 'super_admin', 'cleanup')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Logistics Manager role (role_id = 5) - Operations focused
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT
    5 as role_id,
    p.id as permission_id,
    NOW() as created_at
FROM permissions p
WHERE (
    (p.resource = 'trips' AND p.action IN ('read', 'read_all', 'create', 'update', 'assign', 'track', 'complete', 'schedule', 'route_optimize')) OR
    (p.resource = 'orders' AND p.action IN ('split', 'reassign', 'priority_update')) OR
    (p.resource = 'resources' AND p.action IN ('read', 'read_all', 'drivers_assign', 'vehicles_track', 'vehicles_update', 'inventory_view', 'fuel_manage')) OR
    (p.resource = 'routes' AND p.action IN ('create', 'read', 'read_all', 'update', 'optimize')) OR
    (p.resource = 'schedules' AND p.action IN ('read', 'read_all', 'create', 'update', 'approve', 'publish', 'conflict_check')) OR
    (p.resource = 'tracking' AND p.action IN ('live', 'history', 'reports', 'alerts', 'geofence', 'eta_update', 'proof_of_delivery')) OR
    (p.resource = 'reports' AND p.action IN ('trip', 'driver_performance', 'fleet_utilization', 'fuel_efficiency', 'delivery_performance')) OR
    (p.resource = 'integration' AND p.action = 'notifications') OR
    (p.resource = 'config' AND p.action = 'routes')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Branch Manager role (role_id = 3) - Limited to their operations
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT
    3 as role_id,
    p.id as permission_id,
    NOW() as created_at
FROM permissions p
WHERE (
    (p.resource = 'trips' AND p.action IN ('read', 'read_all', 'create', 'update', 'track', 'complete')) OR
    (p.resource = 'orders' AND p.action IN ('split', 'priority_update')) OR
    (p.resource = 'resources' AND p.action IN ('read', 'read_all', 'drivers_assign', 'vehicles_track')) OR
    (p.resource = 'routes' AND p.action IN ('read', 'read_all')) OR
    (p.resource = 'schedules' AND p.action IN ('read', 'read_all', 'create', 'update')) OR
    (p.resource = 'tracking' AND p.action IN ('live', 'reports')) OR
    (p.resource = 'reports' AND p.action = 'trip')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Driver role (role_id = 6) - Basic access
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT
    6 as role_id,
    p.id as permission_id,
    NOW() as created_at
FROM permissions p
WHERE (
    (p.resource = 'trips' AND p.action IN ('read', 'track', 'complete')) OR
    (p.resource = 'resources' AND p.action IN ('read', 'vehicles_track')) OR
    (p.resource = 'tracking' AND p.action = 'live') OR
    (p.resource = 'documents' AND p.action = 'download') OR
    (p.resource = 'tracking' AND p.action = 'proof_of_delivery')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Customer Service role (role_id = 7) - Order-related access
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT
    7 as role_id,
    p.id as permission_id,
    NOW() as created_at
FROM permissions p
WHERE (
    (p.resource = 'orders' AND p.action IN ('read', 'modify')) OR
    (p.resource = 'tracking' AND p.action = 'history') OR
    (p.resource = 'documents' AND p.action = 'download')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Success notification
DO $$
BEGIN
    RAISE NOTICE 'TMS permissions have been successfully added to the auth database';
    RAISE NOTICE '- Added comprehensive TMS permissions for all roles';
    RAISE NOTICE '- Super Admin: Full TMS system access';
    RAISE NOTICE '- Admin: Complete access within tenant';
    RAISE NOTICE '- Logistics Manager: Operations-focused access';
    RAISE NOTICE '- Branch Manager: Limited but substantial operational access';
    RAISE NOTICE '- Driver: Basic tracking and document access';
    RAISE NOTICE '- Customer Service: Order and tracking access';
END $$;