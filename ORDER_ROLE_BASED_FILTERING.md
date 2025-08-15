# Order Role-Based Filtering Implementation

## Overview
This document explains the implementation of role-based order filtering in the DK-Admin application. The system now filters orders based on user roles:

- **Super Admin**: Can see all orders from all branches with branch information displayed
- **Admin**: Can only see orders assigned to their specific branch
- **Other roles** (customer, technician): Can only see their own orders

## Changes Made

### 1. Updated Orders Page (`app/orders/page.jsx`)
- Changed from using PocketBase directly to using the AuthContext
- Replaced `userRole` parameter with full `user` object
- Now uses `useAuth()` hook for better state management

### 2. Enhanced Order Service (`services/pocketbase/readOrders.js`)
- Added new function `getOrdersByRole(user)` for role-based filtering
- Maintained original `getAllOrders()` for backward compatibility
- Expanded relations to include `branch` information
- Implemented server-side filtering based on user role:
  - **Super-admin**: Fetches all orders with branch expansion
  - **Admin**: Filters by `branch = user.branch_details`
  - **Others**: Filters by `user = user.id`

### 3. Updated Order List Component (`components/v1/orders/OrderList.jsx`)
- Uses new `getOrdersByRole()` function
- Added role-based information banner to inform users what orders they're viewing
- Updated dependency array to include `user` object
- Changed prop from `userRole` to `user` throughout the component

### 4. Enhanced Data Table (`components/v1/orders/DataTable.jsx`)
- Added conditional "Branch" column for super-admin users
- Updated all `userRole` references to use `user?.role`
- Branch column shows `branch_name` from expanded branch relation
- Properly handles role-based permissions for bulk operations

### 5. Improved Order Details Dialog (`components/v1/orders/OrderDetailsDialog.jsx`)
- Added "Branch Information" section for super-admin users
- Shows branch name, manager, and email when available
- Updated role checking logic to use `user?.role`
- Enhanced visual presentation with color-coded sections

## Database Schema Requirements

The implementation relies on the following database relationships:

1. **users table** has a `branch_details` relation field
2. **user_order table** has a `branch` relation field pointing to `branch_details`
3. **branch_details table** contains branch information (name, manager, email, etc.)

## UI/UX Improvements

### Visual Indicators
- **Role-based info banner**: Shows users what orders they can see
- **Branch column**: Only visible to super-admin users
- **Branch information section**: Detailed branch info in order details for super-admin

### Color Coding
- Info banner uses blue theme for consistency
- Branch information section uses blue background to differentiate from other sections
- Status badges maintain existing color scheme

## Security Features

1. **Server-side filtering**: Orders are filtered at the database level, not client-side
2. **Role validation**: All role checks use the authenticated user object
3. **Permission-based UI**: UI elements are conditionally rendered based on user permissions
4. **Safe defaults**: Falls back to restrictive permissions if user data is unavailable

## Error Handling

- Graceful handling of missing user data
- Default to empty array if branch_details is missing for admin users
- Console warnings for configuration issues
- Proper error propagation to UI layer

## Testing Considerations

When testing this implementation:

1. **Super Admin**: Should see all orders with branch column visible
2. **Branch Admin**: Should see only orders from their assigned branch
3. **Customers/Technicians**: Should see only their own orders
4. **Unauthenticated users**: Should see appropriate error messages

## Future Enhancements

- Add branch-based dashboard analytics
- Implement order assignment between branches
- Add branch performance metrics
- Consider adding branch-level user management

## Migration Notes

This is a non-breaking change as:
- Original `getAllOrders()` function is preserved
- New functionality is additive
- Backward compatibility maintained for existing code
- No database schema changes required (uses existing relations)
