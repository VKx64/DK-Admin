# Branch Details Management System

## Overview
The Branch Details Management System provides comprehensive CRUD operations for managing branch information with role-based access control. The system supports different permission levels for super-admins and regular admins.

## Database Schema
The system uses the `branch_details` collection with the following fields:
- `id`: Unique identifier (auto-generated)
- `user_id`: Associated user/admin ID
- `branch_name`: Name of the branch
- `manager_name`: Branch manager's name
- `branch_image`: Optional branch image file
- `branch_email`: Branch contact email
- `branch_latitude`: GPS latitude coordinate
- `branch_longitude`: GPS longitude coordinate
- `created`: Creation timestamp
- `updated`: Last update timestamp

## Role-Based Permissions

### Super Admin (`super-admin`)
- **View**: Can view all branch details across the system
- **Create**: Can create branch details for any user
- **Edit**: Can edit any branch details
- **Delete**: Can delete any branch details
- **Special**: Can assign branch details to different users via `user_id` field

### Admin (`admin`)
- **View**: Can only view their own branch details (where `user_id` matches their ID)
- **Create**: Can create branch details (automatically assigned to their user ID)
- **Edit**: Can only edit their own branch details
- **Delete**: Cannot delete branch details
- **Restriction**: Cannot modify `user_id` field

## Components

### Page Components
- **`BranchDetailsPage`** (`/app/branch_details/page.jsx`): Main page with full CRUD interface
- **`QuickBranchView`** (`/components/v1/branch_details/QuickBranchView.jsx`): Simplified view for admins

### UI Components
- **`BranchDetailsTable`**: Data table with role-based action buttons
- **`BranchDetailsHeader`**: Page header with create button
- **`NewBranchDetails`**: Create new branch details dialog
- **`EditBranchDetails`**: Edit existing branch details dialog
- **`ViewBranchDetails`**: Read-only detail view dialog
- **`BranchDetailsInput`**: Legacy individual form component (still functional)

## Service Functions
Located in `/services/pocketbase/branchDetails.js`:
- `createBranchDetails(data)`
- `updateBranchDetails(id, data)`
- `deleteBranchDetails(id)`
- `getBranchDetailsByUserId(userId)`
- `getAllBranchDetails()` (super-admin only)
- `getBranchDetailsById(id)`
- `checkBranchDetailsPermissions(user, targetUserId)`

## Navigation Integration
The system integrates with the side navigation:
- **Super Admin**: "Branch Details" → Shows all branch details
- **Admin**: "My Branch" → Shows only their branch details

## Security Features
1. **Authentication**: Uses AuthContext for user authentication
2. **Authorization**: Role-based access control at component and API level
3. **Data Filtering**: Automatically filters data based on user role
4. **Permission Checks**: Real-time permission validation
5. **Error Handling**: Comprehensive error handling with user feedback

## Usage Examples

### For Super Admins
1. Navigate to "Branch Details" in sidebar
2. View all branch details in table format
3. Create new branch details for any admin user
4. Edit or delete any branch details
5. Assign branch management to different admin users

### For Admins
1. Navigate to "My Branch" in sidebar
2. View only their assigned branch details
3. Create branch details if none exist
4. Edit their own branch details
5. Cannot delete or modify other branches

## Error Handling
- Invalid permissions show access denied messages
- Network errors display user-friendly toasts
- Form validation prevents invalid data submission
- Loading states provide visual feedback

## File Upload
- Supports branch image upload
- File validation for image formats
- Automatic preview generation
- Secure file storage via PocketBase

## Location Features
- GPS coordinate storage (latitude/longitude)
- Google Maps integration for location viewing
- Location validation and formatting
- Optional location data (not required)

## Responsive Design
- Mobile-friendly interface
- Adaptive table layouts
- Touch-friendly controls
- Consistent with existing design system

## Future Enhancements
- Bulk operations for super admins
- Advanced filtering and search
- Branch analytics and reporting
- Integration with other system modules
- Export/import functionality
