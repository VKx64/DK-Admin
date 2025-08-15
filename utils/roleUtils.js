/**
 * Role-based Access Control Utilities
 *
 * This file contains utility functions for managing role-based permissions
 * across the DK-Admin application.
 */

/**
 * Check if a user can perform product management operations
 * @param {string} userRole - The user's role ('admin', 'super-admin', etc.)
 * @returns {boolean} - True if user can add/edit/delete products
 */
export const canManageProducts = (userRole) => {
  return userRole === 'super-admin';
};

/**
 * Check if a user can view products
 * @param {string} userRole - The user's role
 * @returns {boolean} - True if user can view products
 */
export const canViewProducts = (userRole) => {
  return ['admin', 'super-admin'].includes(userRole);
};

/**
 * Check if a user can manage pricing and discounts
 * @param {string} userRole - The user's role
 * @returns {boolean} - True if user can manage pricing
 */
export const canManagePricing = (userRole) => {
  return userRole === 'super-admin';
};

/**
 * Check if a user can manage stock quantities
 * @param {string} userRole - The user's role
 * @returns {boolean} - True if user can manage stock
 */
export const canManageStock = (userRole) => {
  return userRole === 'super-admin';
};

/**
 * Check if a user can delete products
 * @param {string} userRole - The user's role
 * @returns {boolean} - True if user can delete products
 */
export const canDeleteProducts = (userRole) => {
  return userRole === 'super-admin';
};

/**
 * Get user-friendly role display name
 * @param {string} userRole - The user's role
 * @returns {string} - Display-friendly role name
 */
export const getRoleDisplayName = (userRole) => {
  const roleNames = {
    'admin': 'Administrator',
    'super-admin': 'Super Administrator',
    'technician': 'Technician',
    'customer': 'Customer'
  };

  return roleNames[userRole] || 'Unknown Role';
};

/**
 * Get permission error message for a specific action
 * @param {string} action - The action being attempted
 * @param {string} userRole - The user's role
 * @returns {string} - Error message explaining the permission restriction
 */
export const getPermissionErrorMessage = (action, userRole) => {
  const messages = {
    'add-product': 'Only Super Administrators can add new products.',
    'edit-product': 'Only Super Administrators can edit products.',
    'delete-product': 'Only Super Administrators can delete products.',
    'manage-pricing': 'Only Super Administrators can manage pricing and discounts.',
    'manage-stock': 'Only Super Administrators can manage stock quantities.',
    'batch-discount': 'Only Super Administrators can apply batch discounts.'
  };

  return messages[action] || 'You do not have permission to perform this action.';
};
