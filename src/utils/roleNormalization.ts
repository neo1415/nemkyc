/**
 * Utility for normalizing and handling role variations across the application
 */

// Map of role variations to standardized role names
const ROLE_MAPPINGS: Record<string, string> = {
  // Super admin variations
  'superadmin': 'super admin',
  'super-admin': 'super admin',
  'super_admin': 'super admin',
  'super admin': 'super admin',
  
  // Admin variations
  'admin': 'admin',
  
  // Compliance variations
  'compliance': 'compliance',
  
  // Claims variations
  'claims': 'claims',
  
  // Default/user variations
  'default': 'default',
  'user': 'default',
  'regular': 'default',
};

// Standard admin roles
export const ADMIN_ROLES = ['super admin', 'admin', 'compliance', 'claims'];

/**
 * Normalize a role string to its standard format
 * Handles case variations, spacing, and alternative names
 */
export const normalizeRole = (role: string | undefined): string => {
  if (!role) return 'default';
  
  // Trim and convert to lowercase
  const normalizedInput = role.toLowerCase().trim();
  
  // Return mapped role or default
  return ROLE_MAPPINGS[normalizedInput] || 'default';
};

/**
 * Check if a role is an admin role
 */
export const isAdminRole = (role: string | undefined): boolean => {
  const normalized = normalizeRole(role);
  return ADMIN_ROLES.includes(normalized);
};

/**
 * Compare two roles for equality (case-insensitive, handles variations)
 */
export const rolesMatch = (role1: string | undefined, role2: string | undefined): boolean => {
  return normalizeRole(role1) === normalizeRole(role2);
};

/**
 * Check if a role matches any of the allowed roles
 */
export const hasAnyRole = (userRole: string | undefined, allowedRoles: string[]): boolean => {
  const normalizedUserRole = normalizeRole(userRole);
  return allowedRoles.some(allowedRole => normalizeRole(allowedRole) === normalizedUserRole);
};
