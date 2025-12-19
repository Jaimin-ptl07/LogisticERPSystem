-- Add TMS Permissions to Auth Database Schema
-- This script adds comprehensive permissions for Transportation Management System

-- TMS Permission definitions to be added to the existing permissions table
-- Note: This assumes the permissions table already exists and has the structure

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
    ('trips', 'route_optimize', 'Optimize trip routes'),

-- Order management permissions (TMS-specific)
    ('orders', 'split', 'Split orders between trips'),
    ('orders', 'reassign', 'Reassign orders to different trips'),
    ('orders', 'merge', 'Merge multiple orders'),
    ('orders', 'priority_update', 'Update order priority'),
    ('orders', 'modify', 'Modify order details'),

-- Resource management permissions
    ('resources', 'read', 'Read TMS resources'),
    ('resources', 'read_all', 'Read all TMS resources'),
    ('resources', 'drivers_assign', 'Assign drivers to trips'),
    ('resources', 'vehicles_track', 'Track vehicle locations'),
    ('resources', 'vehicles_update', 'Update vehicle information'),
    ('resources', 'inventory_view', 'View inventory levels'),
    ('resources', 'fuel_manage', 'Manage fuel consumption'),

-- Route management permissions
    ('routes', 'create', 'Create delivery routes'),
    ('routes', 'read', 'Read route information'),
    ('routes', 'read_all', 'Read all routes'),
    ('routes', 'update', 'Update route information'),
    ('routes', 'delete', 'Delete routes'),
    ('routes', 'optimize', 'Optimize route efficiency'),
    ('routes', 'geo_fence', 'Manage geofencing rules'),

-- Schedule management permissions
    ('schedules', 'read', 'View schedules'),
    ('schedules', 'read_all', 'View all schedules'),
    ('schedules', 'create', 'Create schedules'),
    ('schedules', 'update', 'Update schedules'),
    ('schedules', 'delete', 'Delete schedules'),
    ('schedules', 'approve', 'Approve schedules'),
    ('schedules', 'publish', 'Publish schedules'),
    ('schedules', 'conflict_check', 'Check scheduling conflicts'),

-- Tracking and monitoring permissions
    ('tracking', 'live', 'Live vehicle tracking'),
    ('tracking', 'history', 'View tracking history'),
    ('tracking', 'reports', 'Generate tracking reports'),
    ('tracking', 'alerts', 'Manage tracking alerts'),
    ('tracking', 'geofence', 'Manage geofence alerts'),
    ('tracking', 'eta_update', 'Update ETA predictions'),
    ('tracking', 'proof_of_delivery', 'Proof of delivery management'),

-- Document management permissions
    ('documents', 'upload', 'Upload documents'),
    ('documents', 'download', 'Download documents'),
    ('documents', 'verify', 'Verify document authenticity'),
    ('documents', 'archive', 'Archive old documents'),
    ('documents', 'manage_all', 'Full document management'),

-- Reporting and analytics permissions
    ('reports', 'trip', 'Generate trip reports'),
    ('reports', 'driver_performance', 'View driver performance reports'),
    ('reports', 'fleet_utilization', 'Fleet utilization reports'),
    ('reports', 'fuel_efficiency', 'Fuel efficiency reports'),
    ('reports', 'delivery_performance', 'Delivery performance reports'),
    ('reports', 'revenue', 'Revenue and profit reports'),
    ('reports', 'custom', 'Create custom reports'),
    ('reports', 'export', 'Export reports to various formats'),

-- Integration permissions
    ('integration', 'customers', 'Integrate with customer service'),
    ('integration', 'orders', 'Integrate with order service'),
    ('integration', 'vehicles', 'Integrate with vehicle service'),
    ('integration', 'branches', 'Integrate with branch service'),
    ('integration', 'billing', 'Integrate with billing service'),
    ('integration', 'notifications', 'Manage system notifications'),

-- Configuration permissions
    ('config', 'rules', 'Configure TMS business rules'),
    ('config', 'rates', 'Configure shipping rates'),
    ('config', 'routes', 'Configure default routes'),
    ('config', 'users', 'Manage user access'),
    ('config', 'api_keys', 'Manage API access keys'),
    ('config', 'system', 'System configuration'),
    ('config', 'backups', 'Configure backup policies'),

-- Audit and compliance permissions
    ('audit', 'read', 'View audit logs'),
    ('audit', 'export', 'Export audit data'),
    ('audit', 'cleanup', 'Manage audit log retention'),
    ('compliance', 'read', 'View compliance reports'),
    ('compliance', 'export', 'Export compliance data'),

-- Super Admin permissions (for multi-tenant management)
    ('tms', 'multi_tenant_manage', 'Manage multiple tenants'),
    ('tms', 'super_admin', 'TMS super admin access'),

ON CONFLICT DO NOTHING;

-- Assign TMS permissions to roles
-- Super Admin role (role_id = 1) - Full access
INSERT INTO role_permissions (role_id, permission_id) VALUES
    (1, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'read')),
    (1, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'read_all')),
    (1, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'create')),
    (1, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'update')),
    (1, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'delete')),
    (1, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'assign')),
    (1, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'track')),
    (1, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'cancel')),
    (1, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'complete')),
    (1, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'manage_all')),
    (1, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'schedule')),
    (1, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'route_optimize')),
    (1, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'split')),
    (1, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'reassign')),
    (1, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'merge')),
    (1, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'priority_update')),
    (1, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'modify')),
    (1, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'read')),
    (1, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'read_all')),
    (1, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'drivers_assign')),
    (1, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'vehicles_track')),
    (1, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'vehicles_update')),
    (1, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'inventory_view')),
    (1, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'fuel_manage')),
    (1, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'create')),
    (1, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'read')),
    (1, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'read_all')),
    (1, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'update')),
    (1, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'delete')),
    (1, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'optimize')),
    (1, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'geo_fence')),
    (1, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'read')),
    (1, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'read_all')),
    (1, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'create')),
    (1, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'update')),
    (1, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'delete')),
    (1, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'approve')),
    (1, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'publish')),
    (1, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'conflict_check')),
    (1, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'live')),
    (1, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'history')),
    (1, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'reports')),
    (1, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'alerts')),
    (1, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'geofence')),
    (1, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'eta_update')),
    (1, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'proof_of_delivery')),
    (1, (SELECT id FROM permissions WHERE resource = 'documents' AND action = 'upload')),
    (1, (SELECT id FROM permissions WHERE resource = 'documents' AND action = 'download')),
    (1, (SELECT id FROM permissions WHERE resource = 'documents' AND action = 'verify')),
    (1, (SELECT id FROM permissions WHERE resource = 'documents' AND action = 'archive')),
    (1, (SELECT id FROM permissions WHERE resource = 'documents' AND action = 'manage_all')),
    (1, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'trip')),
    (1, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'driver_performance')),
    (1, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'fleet_utilization')),
    (1, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'fuel_efficiency')),
    (1, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'delivery_performance')),
    (1, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'revenue')),
    (1, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'custom')),
    (1, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'export')),
    (1, (SELECT id FROM permissions WHERE resource = 'integration' AND action = 'customers')),
    (1, (SELECT id FROM permissions WHERE resource = 'integration' AND action = 'orders')),
    (1, (SELECT id FROM permissions WHERE resource = 'integration' AND action = 'vehicles')),
    (1, (SELECT id FROM permissions WHERE resource = 'integration' AND action = 'branches')),
    (1, (SELECT id FROM permissions WHERE resource = 'integration' AND action = 'billing')),
    (1, (SELECT id FROM permissions WHERE resource = 'integration' AND action = 'notifications')),
    (1, (SELECT id FROM permissions WHERE resource = 'config' AND action = 'rules')),
    (1, (SELECT id FROM permissions WHERE resource = 'config' AND action = 'rates')),
    (1, (SELECT id FROM permissions WHERE resource = 'config' AND action = 'routes')),
    (1, (SELECT id FROM permissions WHERE resource = 'config' AND action = 'users')),
    (1, (SELECT id FROM permissions WHERE resource = 'config' AND action = 'api_keys')),
    (1, (SELECT id FROM permissions WHERE resource = 'config' AND action = 'system')),
    (1, (SELECT id FROM permissions WHERE resource = 'config' AND action = 'backups')),
    (1, (SELECT id FROM permissions WHERE resource = 'audit' AND action = 'read')),
    (1, (SELECT id FROM permissions WHERE resource = 'audit' AND action = 'export')),
    (1, (SELECT id FROM permissions WHERE resource = 'audit' AND action = 'cleanup')),
    (1, (SELECT id FROM permissions WHERE resource = 'compliance' AND action = 'read')),
    (1, (SELECT id FROM permissions WHERE resource = 'compliance' AND action = 'export')),
    (1, (SELECT id FROM permissions WHERE resource = 'tms' AND action = 'multi_tenant_manage')),
    (1, (SELECT id FROM permissions WHERE resource = 'tms' AND action = 'super_admin'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin role (role_id = 2) - Comprehensive access within tenant
INSERT INTO role_permissions (role_id, permission_id) VALUES
    (2, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'read')),
    (2, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'read_all')),
    (2, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'create')),
    (2, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'update')),
    (2, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'delete')),
    (2, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'assign')),
    (2, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'track')),
    (2, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'cancel')),
    (2, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'complete')),
    (2, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'schedule')),
    (2, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'route_optimize')),
    (2, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'split')),
    (2, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'reassign')),
    (2, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'priority_update')),
    (2, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'modify')),
    (2, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'read')),
    (2, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'read_all')),
    (2, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'drivers_assign')),
    (2, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'vehicles_track')),
    (2, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'vehicles_update')),
    (2, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'inventory_view')),
    (2, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'fuel_manage')),
    (2, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'create')),
    (2, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'read')),
    (2, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'read_all')),
    (2, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'update')),
    (2, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'optimize')),
    (2, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'read')),
    (2, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'read_all')),
    (2, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'create')),
    (2, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'update')),
    (2, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'approve')),
    (2, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'publish')),
    (2, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'conflict_check')),
    (2, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'live')),
    (2, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'history')),
    (2, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'reports')),
    (2, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'alerts')),
    (2, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'eta_update')),
    (2, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'proof_of_delivery')),
    (2, (SELECT id FROM permissions WHERE resource = 'documents' AND action = 'upload')),
    (2, (SELECT id FROM permissions WHERE resource = 'documents' AND action = 'download')),
    (2, (SELECT id FROM permissions WHERE resource = 'documents' AND action = 'verify')),
    (2, (SELECT id FROM permissions WHERE resource = 'documents' AND action = 'archive')),
    (2, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'trip')),
    (2, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'driver_performance')),
    (2, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'fleet_utilization')),
    (2, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'fuel_efficiency')),
    (2, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'delivery_performance')),
    (2, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'revenue')),
    (2, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'custom')),
    (2, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'export')),
    (2, (SELECT id FROM permissions WHERE resource = 'integration' AND action = 'customers')),
    (2, (SELECT id FROM permissions WHERE resource = 'integration' AND action = 'orders')),
    (2, (SELECT id FROM permissions WHERE resource = 'integration' AND action = 'vehicles')),
    (2, (SELECT id FROM permissions WHERE resource = 'integration' AND action = 'branches')),
    (2, (SELECT id FROM permissions WHERE resource = 'integration' AND action = 'billing')),
    (2, (SELECT id FROM permissions WHERE resource = 'integration' AND action = 'notifications')),
    (2, (SELECT id FROM permissions WHERE resource = 'config' AND action = 'rules')),
    (2, (SELECT id FROM permissions WHERE resource = 'config' AND action = 'rates')),
    (2, (SELECT id FROM permissions WHERE resource = 'config' AND action = 'routes')),
    (2, (SELECT id FROM permissions WHERE resource = 'config' AND action = 'users')),
    (2, (SELECT id FROM permissions WHERE resource = 'config' AND action = 'backups'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Logistics Manager role (role_id = 5) - Operations focused
INSERT INTO role_permissions (role_id, permission_id) VALUES
    (5, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'read')),
    (5, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'read_all')),
    (5, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'create')),
    (5, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'update')),
    (5, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'assign')),
    (5, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'track')),
    (5, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'complete')),
    (5, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'schedule')),
    (5, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'route_optimize')),
    (5, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'split')),
    (5, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'reassign')),
    (5, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'priority_update')),
    (5, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'read')),
    (5, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'read_all')),
    (5, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'drivers_assign')),
    (5, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'vehicles_track')),
    (5, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'vehicles_update')),
    (5, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'inventory_view')),
    (5, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'fuel_manage')),
    (5, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'create')),
    (5, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'read')),
    (5, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'read_all')),
    (5, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'update')),
    (5, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'optimize')),
    (5, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'read')),
    (5, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'read_all')),
    (5, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'create')),
    (5, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'update')),
    (5, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'approve')),
    (5, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'publish')),
    (5, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'conflict_check')),
    (5, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'live')),
    (5, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'history')),
    (5, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'reports')),
    (5, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'alerts')),
    (5, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'geofence')),
    (5, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'eta_update')),
    (5, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'proof_of_delivery')),
    (5, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'trip')),
    (5, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'driver_performance')),
    (5, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'fleet_utilization')),
    (5, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'fuel_efficiency')),
    (5, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'delivery_performance')),
    (5, (SELECT id FROM permissions WHERE resource = 'integration' AND action = 'notifications')),
    (5, (SELECT id FROM permissions WHERE resource = 'config' AND action = 'routes'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Branch Manager role (role_id = 3) - Limited to their operations
INSERT INTO role_permissions (role_id, permission_id) VALUES
    (3, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'read')),
    (3, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'read_all')),
    (3, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'create')),
    (3, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'update')),
    (3, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'track')),
    (3, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'complete')),
    (3, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'split')),
    (3, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'priority_update')),
    (3, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'read')),
    (3, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'read_all')),
    (3, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'drivers_assign')),
    (3, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'vehicles_track')),
    (3, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'read')),
    (3, (SELECT id FROM permissions WHERE resource = 'routes' AND action = 'read_all')),
    (3, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'read')),
    (3, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'read_all')),
    (3, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'create')),
    (3, (SELECT id FROM permissions WHERE resource = 'schedules' AND action = 'update')),
    (3, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'live')),
    (3, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'reports')),
    (3, (SELECT id FROM permissions WHERE resource = 'reports' AND action = 'trip'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Driver role (role_id = 6) - Basic access
INSERT INTO role_permissions (role_id, permission_id) VALUES
    (6, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'read')),
    (6, (6, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'read_all')),
    (6, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'track')),
    (6, (SELECT id FROM permissions WHERE resource = 'trips' AND action = 'complete')),
    (6, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'read')),
    (6, (SELECT id FROM permissions WHERE resource = 'resources' AND action = 'vehicles_track')),
    (6, (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'live')),
    (6, (SELECT id FROM permissions WHERE resource = 'documents' AND action = 'download')),
    (SELECT id FROM permissions WHERE resource = 'tracking' AND action = 'proof_of_delivery'))
ON CONFLICT (role_id, permission_id) DO NOT EXPECTING;

-- Customer Service role (role_id = 7) - Order-related access
INSERT INTO role_permissions (role_id, permission_id) VALUES
    (7, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'read')),
    (7, (SELECT id FROM permissions WHERE resource = 'orders' AND action = 'modify')),
    (7, (SELECT id FROM permissions WHERE resource FROM 'tracking' AND action = 'history')),
    (7, (SELECT id FROM permissions WHERE resource FROM 'documents' AND action = 'download'))
ON CONFLICT (role_id, permission_id) DO NOT EXPECTING;

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