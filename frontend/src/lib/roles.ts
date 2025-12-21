/**
 * Role-based access control constants and utilities
 */

// Role constants
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  COMPANY_ADMIN: "company_admin",
  BRANCH_MANAGER: "branch_manager",
  FINANCE_MANAGER: "finance_manager",
  LOGISTICS_MANAGER: "logistics_manager",
  DRIVER: "driver",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.COMPANY_ADMIN]: 80,
  [ROLES.FINANCE_MANAGER]: 60,
  [ROLES.LOGISTICS_MANAGER]: 60,
  [ROLES.BRANCH_MANAGER]: 50,
  [ROLES.DRIVER]: 10,
};

// Role display names
export const ROLE_NAMES: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.COMPANY_ADMIN]: "Company Admin",
  [ROLES.BRANCH_MANAGER]: "Branch Manager",
  [ROLES.FINANCE_MANAGER]: "Finance Manager",
  [ROLES.LOGISTICS_MANAGER]: "Logistics Manager",
  [ROLES.DRIVER]: "Driver",
};

// Role-based route access
export const ROLE_ROUTES: Record<Role, string[]> = {
  [ROLES.SUPER_ADMIN]: [
    "/super-admin",
    "/company-admin",
    "/branch-manager",
    "/finance-manager",
    "/logistics-manager",
    "/driver",
    "/drivermodule", // Temporary renamed protected driver route
  ],
  [ROLES.COMPANY_ADMIN]: [
    "/company-admin",
    "/branch-manager",
    "/finance-manager",
    "/logistics-manager",
  ],
  [ROLES.FINANCE_MANAGER]: ["/finance-manager"],
  [ROLES.LOGISTICS_MANAGER]: ["/logistics-manager"],
  [ROLES.BRANCH_MANAGER]: ["/branch-manager"],
  [ROLES.DRIVER]: ["/drivermodule"], // Temporary renamed protected driver route
};

// Default redirect per role
export const ROLE_DEFAULT_ROUTE: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: "/super-admin",
  [ROLES.COMPANY_ADMIN]: "/company-admin/masters",
  [ROLES.BRANCH_MANAGER]: "/branch-manager/dashboard",
  [ROLES.FINANCE_MANAGER]: "/finance-manager/dashboard",
  [ROLES.LOGISTICS_MANAGER]: "/logistics-manager/dashboard",
  [ROLES.DRIVER]: "/drivermodule/trips", // Temporary renamed protected driver route
};

/**
 * Check if user has required role
 */
export function hasRole(
  userRole: string | undefined,
  requiredRole: Role
): boolean {
  if (!userRole) return false;
  return userRole === requiredRole;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(
  userRole: string | undefined,
  requiredRoles: Role[]
): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole as Role);
}

/**
 * Check if user role has higher or equal hierarchy level
 */
export function hasMinimumRole(
  userRole: string | undefined,
  minimumRole: Role
): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY[userRole as Role] || 0;
  const minimumLevel = ROLE_HIERARCHY[minimumRole] || 0;
  return userLevel >= minimumLevel;
}

/**
 * Normalize role name to match our role constants
 * Handles variations like "Company Admin" -> "company_admin"
 */
function normalizeRoleName(roleName: string | undefined): Role | undefined {
  if (!roleName) return undefined;

  // Convert to lowercase and replace spaces/underscores
  const normalized = roleName.toLowerCase().replace(/[\s_-]+/g, "_");

  // Check if it matches any of our role constants
  const roleValues = Object.values(ROLES);
  const matchedRole = roleValues.find((r) => r === normalized);

  if (matchedRole) {
    return matchedRole;
  }

  // Try to find by partial match (e.g., "companyadmin" -> "company_admin")
  for (const role of roleValues) {
    if (
      normalized.includes(role.replace("_", "")) ||
      role.replace("_", "").includes(normalized)
    ) {
      return role;
    }
  }

  return undefined;
}

/**
 * Get accessible routes for a role
 */
export function getAccessibleRoutes(userRole: string | undefined): string[] {
  if (!userRole) return [];
  const normalizedRole = normalizeRoleName(userRole);
  if (!normalizedRole) return [];
  return ROLE_ROUTES[normalizedRole] || [];
}

/**
 * Check if user can access a route
 */
export function canAccessRoute(
  userRole: string | undefined,
  route: string
): boolean {
  if (!userRole) return false;

  const normalizedRole = normalizeRoleName(userRole);
  if (!normalizedRole) {
    // If role can't be normalized, allow access to prevent infinite loops
    // Log a warning for debugging
    console.warn(
      `Unknown role format: "${userRole}". Allowing access to prevent redirect loop.`
    );
    return true;
  }

  // Super admin can access everything
  if (normalizedRole === ROLES.SUPER_ADMIN) return true;

  const accessibleRoutes = getAccessibleRoutes(userRole);
  return accessibleRoutes.some((r) => route.startsWith(r));
}

/**
 * Get default route for user role
 */
export function getDefaultRoute(userRole: string | undefined): string {
  if (!userRole) return "/login";
  const normalizedRole = normalizeRoleName(userRole);
  if (!normalizedRole) return "/company-admin/masters";
  return ROLE_DEFAULT_ROUTE[normalizedRole] || "/company-admin/masters";
}
