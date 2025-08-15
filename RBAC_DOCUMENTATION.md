# Role-Based Access Control (RBAC) Implementation

This document describes the role-based access control system implemented in the DK-Admin products management module.

## Overview

The system restricts access to product management features based on user roles. There are two main user roles in the products module:

- **Admin**: Limited access to view products only
- **Super-Admin**: Full access to all product management features

## Role Permissions

### Admin Users
- ✅ Can view products list
- ✅ Can search and filter products
- ❌ Cannot add new products
- ❌ Cannot edit existing products
- ❌ Cannot delete products
- ❌ Cannot manage pricing/discounts
- ❌ Cannot manage stock quantities
- ❌ Cannot access discount filters

### Super-Admin Users
- ✅ Can view products list
- ✅ Can search and filter products
- ✅ Can add new products
- ✅ Can edit existing products
- ✅ Can delete products
- ✅ Can manage pricing/discounts
- ✅ Can manage stock quantities
- ✅ Can access all filters including discount filters
- ✅ Can apply batch discounts

## Implementation Details

### Components Affected

1. **Header Component** (`components/v1/products/Header.jsx`)
   - "Add Product" button is conditionally rendered based on user role
   - Only visible to super-admin users

2. **ProductForm Component** (`components/v1/products/ProductForm.jsx`)
   - Form submission is blocked for admin users
   - Discount and stock fields are read-only for admin users
   - Appropriate error messages are shown

3. **DataTable Component** (`components/v1/products/DataTable.jsx`)
   - Edit button is disabled for admin users
   - Delete functionality remains accessible to both roles
   - Batch discount functionality is restricted to super-admin users

4. **Filters Component** (`components/v1/products/Filters.jsx`)
   - Discount filter dropdown is disabled for admin users
   - Other filters (price, stock, category) remain accessible

### Utility Functions

Role-based logic is centralized in `utils/roleUtils.js`:

- `canManageProducts(userRole)` - Check if user can add/edit products
- `canManagePricing(userRole)` - Check if user can manage pricing/discounts
- `canManageStock(userRole)` - Check if user can manage stock quantities
- `canDeleteProducts(userRole)` - Check if user can delete products
- `getPermissionErrorMessage(action, userRole)` - Get user-friendly error messages

### User Role Detection

User roles are obtained from PocketBase authentication:
```javascript
const userRole = pb.authStore.record?.role;
```

## Usage Examples

### Conditional Rendering
```jsx
import { canManageProducts } from "@/utils/roleUtils";

{canManageProducts(userRole) && (
  <Button onClick={() => setIsProductFormOpen(true)}>
    Add Product
  </Button>
)}
```

### Form Field Restrictions
```jsx
import { canManagePricing } from "@/utils/roleUtils";

<Input
  disabled={!canManagePricing(userRole)}
  title={!canManagePricing(userRole) ? 'Only super-admin can modify pricing' : undefined}
/>
```

### Error Messages
```jsx
import { getPermissionErrorMessage } from "@/utils/roleUtils";

if (!canManageProducts(userRole)) {
  alert(getPermissionErrorMessage('add-product', userRole));
  return;
}
```

## Security Considerations

- All role checks are implemented on the client-side for UI purposes
- Server-side validation should also be implemented for security
- Role information is stored in the user's authentication token
- The system assumes that role information is trustworthy from PocketBase

## Future Enhancements

1. **Granular Permissions**: Could be extended to support more specific permissions
2. **Permission Groups**: Could group related permissions for easier management
3. **Dynamic Role Configuration**: Could allow roles and permissions to be configured dynamically
4. **Audit Logging**: Could add logging for permission-related actions
5. **Role Hierarchies**: Could implement role inheritance (e.g., super-admin inherits admin permissions)
