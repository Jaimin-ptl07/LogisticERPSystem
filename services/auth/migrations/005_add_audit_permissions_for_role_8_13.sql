-- =====================================================
-- Migration: Add Audit Log Permissions for Roles 8-13
-- =====================================================
-- This migration assigns audit log permissions to the additional roles
-- that exist in the database (role_id 8-13)
--
-- Roles mapping:
-- ID 8: Admin (duplicate - needs full audit access)
-- ID 9: Branch Manager (duplicate - needs create, read, stats)
-- ID 10: Finance Manager (duplicate - needs create, read, stats)
-- ID 11: Logistics Manager (duplicate - needs create, read, stats)
-- ID 12: Driver (duplicate - no audit access)
-- ID 13: User (duplicate - no audit access)

-- Assign ALL audit permissions to role_id=8 (Admin)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT
    'rp_role8_audit_' || p.action,
    8,
    p.id,
    NOW()
FROM permissions p
WHERE p.resource = 'audit'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign create, read, and stats to role_id=9 (Branch Manager)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT
    'rp_role9_audit_' || p.action,
    9,
    p.id,
    NOW()
FROM permissions p
WHERE p.resource = 'audit' AND p.action IN ('create', 'read', 'stats')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign create, read, and stats to role_id=10 (Finance Manager)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT
    'rp_role10_audit_' || p.action,
    10,
    p.id,
    NOW()
FROM permissions p
WHERE p.resource = 'audit' AND p.action IN ('create', 'read', 'stats')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign create, read, and stats to role_id=11 (Logistics Manager)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT
    'rp_role11_audit_' || p.action,
    11,
    p.id,
    NOW()
FROM permissions p
WHERE p.resource = 'audit' AND p.action IN ('create', 'read', 'stats')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Role 12 (Driver) - No audit access - skipping
-- Role 13 (User) - No audit access - skipping

-- Verification query (commented out)
-- SELECT r.id, r.name, p.resource, p.action
-- FROM role_permissions rp
-- JOIN roles r ON rp.role_id = r.id
-- JOIN permissions p ON rp.permission_id = p.id
-- WHERE r.id >= 8 AND p.resource = 'audit'
-- ORDER BY r.id, p.action;
