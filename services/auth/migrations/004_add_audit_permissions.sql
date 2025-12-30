-- =====================================================
-- Migration: Add Audit Log Permissions
-- =====================================================
-- This adds audit log permissions and assigns them to roles

-- Step 1: Add audit log permissions
INSERT INTO permissions (resource, action, description, created_at)
VALUES
    ('audit', 'create', 'Create audit log entries', NOW()),
    ('audit', 'read', 'View audit log entries', NOW()),
    ('audit', 'read_all', 'View all audit log entries', NOW()),
    ('audit', 'stats', 'View audit log statistics', NOW()),
    ('audit', 'delete', 'Delete audit log entries', NOW())
ON CONFLICT (resource, action) DO NOTHING;

-- Step 2: Assign audit permissions to Super Admin (ID: 1) - ALL permissions
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 1, p.id, NOW()
FROM permissions p
WHERE p.resource = 'audit'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Step 3: Assign audit permissions to Admin (ID: 2) - ALL permissions
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 2, p.id, NOW()
FROM permissions p
WHERE p.resource = 'audit'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Step 4: Assign audit permissions to Branch Manager (ID: 3) - READ and STATS only
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 3, p.id, NOW()
FROM permissions p
WHERE p.resource = 'audit' AND p.action IN ('read', 'stats')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Step 5: Assign audit permissions to Finance Manager (ID: 4) - READ and STATS only
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 4, p.id, NOW()
FROM permissions p
WHERE p.resource = 'audit' AND p.action IN ('read', 'stats')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Step 6: Assign audit permissions to Logistics Manager (ID: 5) - READ and STATS only
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 5, p.id, NOW()
FROM permissions p
WHERE p.resource = 'audit' AND p.action IN ('read', 'stats')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Step 7: Driver (ID: 6) - NO audit access

-- Step 8: User (ID: 7) - NO audit access
