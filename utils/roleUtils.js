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
 * Check if a user can access analytics dashboard
 * @param {string} userRole - The user's role
 * @returns {boolean} - True if user can view analytics
 */
export const canViewAnalytics = (userRole) => {
  return ['admin', 'super-admin'].includes(userRole);
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

/**
 * Check if a user can view all orders from all branches
 * @param {string} userRole - The user's role
 * @returns {boolean} - True if user can view all orders
 */
export const canViewAllOrders = (userRole) => {
  return userRole === 'super-admin';
};

/**
 * Check if a user should only see orders from their assigned branch
 * @param {string} userRole - The user's role
 * @returns {boolean} - True if user should see branch-specific orders only
 */
export const shouldFilterByBranch = (userRole) => {
  return userRole === 'admin';
};

/**
 * Get the branch IDs that a user can access
 * @param {Object} user - The user object from PocketBase
 * @returns {Array|null} - Array of branch IDs the user can access, or null for super-admin (all branches)
 */
export const getUserAccessibleBranches = (user) => {
  if (!user) {
    console.warn('getUserAccessibleBranches: No user provided');
    return [];
  }

  // Super-admin can access all branches (return null to indicate no filtering needed)
  if (user.role === 'super-admin') {
    console.log('getUserAccessibleBranches: Super-admin has access to all branches');
    return null;
  }

  // Admin can only access their assigned branch
  if (user.role === 'admin') {
    // Try to get branch_details from different possible locations
    const branchId = user.branch_details || user.expand?.branch_details?.id;

    if (branchId) {
      console.log(`getUserAccessibleBranches: Admin has access to branch: ${branchId}`);
      return [branchId];
    } else {
      console.warn('getUserAccessibleBranches: Admin user has no branch_details assigned');
      console.warn('User object:', {
        id: user.id,
        role: user.role,
        branch_details: user.branch_details,
        'expand.branch_details': user.expand?.branch_details
      });
      return [];
    }
  }

  // Other roles (technician, customer) should not have branch access for orders
  // but may access orders based on other criteria
  console.log(`getUserAccessibleBranches: Role '${user.role}' has no branch-based order access`);
  return [];
};
