# 👥 Customer Management System - Implementation Documentation

## Overview

Implemented a comprehensive customer management system with role-based branch filtering. Super-admins can view all customers from all branches with filtering options, while admins only see customers from their assigned branch.

---

## ✅ Features Implemented

### 1. **Role-Based Access Control**
- **Super-Admin**: Views all customers from all branches
  - Can filter customers by specific branch
  - Can filter unassigned customers (no branch)
  - Full visibility across the organization

- **Admin**: Views only customers from their assigned branch
  - Automatically filtered by their branch assignment
  - No cross-branch visibility
  - Cannot see unassigned customers

### 2. **Customer List Display**
- ✅ Avatar with fallback initials
- ✅ Customer name and email
- ✅ Branch assignment (for super-admin view)
- ✅ Verification status (Verified/Pending)
- ✅ Total order count
- ✅ Join date
- ✅ Quick view action button

### 3. **Search & Filtering**
- ✅ Search by customer name or email
- ✅ Branch filter (super-admin only)
  - All Branches
  - Unassigned customers
  - Specific branch selection
- ✅ Real-time client-side filtering
- ✅ Pagination support (20 customers per page)

### 4. **Customer Details Dialog**
Comprehensive customer information with three tabs:

**Profile Tab:**
- Avatar and basic information
- Email, ID, role, member since
- Verification status
- Branch assignment details (with map coordinates if available)

**Orders Tab:**
- Complete order history
- Order status, payment method, delivery fee
- Branch information per order
- Order date

**Statistics Tab:**
- Total orders count
- Completed orders
- Pending orders
- Cancelled orders
- Lifetime spending (total value from completed orders)

### 5. **Order Statistics Integration**
- Fetches order data for each customer
- Calculates real-time statistics:
  - Total orders
  - Completed count
  - Pending count
  - Cancelled count
  - Total spending amount

---

## 📁 Files Created

### **1. Service Layer**
**File:** `/workspaces/services/pocketbase/readCustomers.js`

Functions implemented:
- `getAllCustomers()` - Fetch all customers (users with role="customer")
- `getCustomersByRole(user)` - Role-based customer fetching with branch filtering
- `getCustomerById(customerId)` - Get single customer with expanded relations
- `getCustomersWithOrderStats(user)` - Customers with calculated order statistics
- `searchCustomers(searchQuery, user)` - Search customers by name/email

**Key Features:**
- Role-based filtering using existing `roleUtils` functions
- Branch filtering for admins using `getUserAccessibleBranches()`
- Detailed console logging for debugging
- Expands `branch_details` relation
- Order statistics calculation

### **2. Components**

#### **Header Component**
**File:** `/workspaces/components/v1/customers/Header.jsx`

- Clean header with title and icon
- Refresh button with loading state
- Consistent styling with other modules

#### **Filters Component**
**File:** `/workspaces/components/v1/customers/Filters.jsx`

- Search input for name/email filtering
- Branch dropdown (super-admin only)
- Fetches all branches from PocketBase
- Options: All Branches, Unassigned, specific branches

#### **DataTable Component**
**File:** `/workspaces/components/v1/customers/DataTable.jsx`

- TanStack React Table implementation
- Conditional columns based on user role
- Checkbox selection support
- Avatar display with fallback
- Branch badges (super-admin view)
- Verification status badges
- Order count display
- Sortable columns
- Action buttons

#### **CustomerDetailsDialog Component**
**File:** `/workspaces/components/v1/customers/CustomerDetailsDialog.jsx`

- Three-tab layout (Profile, Orders, Statistics)
- Avatar display with fallback initials
- Branch assignment information
- Order history with status badges
- Order statistics cards
- Lifetime spending calculation
- Responsive design

#### **CustomerList Component**
**File:** `/workspaces/components/v1/customers/CustomerList.jsx`

- Main container component
- Data fetching and state management
- Client-side filtering and pagination
- Role-based filtering info banner
- Loading/error states
- Refresh functionality via ref
- Empty state handling

### **3. Page Implementation**
**File:** `/workspaces/app/customers/page.jsx`

- Client component with AuthContext
- Header and CustomerList integration
- Refresh functionality
- User prop passing

---

## 🗄️ Database Schema

### **Users Collection** (`users`)
The customer management system uses the existing `users` collection from PocketBase:

**Relevant Fields:**
```json
{
  "id": "text (15 chars)",
  "email": "email (required)",
  "name": "text",
  "avatar": "file (images only)",
  "role": "select (customer, admin, technician, super-admin)",
  "branch_details": "relation (to branch_details collection)",
  "verified": "boolean",
  "emailVisibility": "boolean",
  "created": "autodate",
  "updated": "autodate"
}
```

**Filters Used:**
- `role = "customer"` - Get only customer users
- `branch_details = "{branch_id}"` - Filter by branch (for admins)
- Name/email search via client-side filtering

**Expanded Relations:**
- `branch_details` - Branch information including name, email, coordinates

---

## 🔐 Role-Based Access Control

### **Super-Admin**
```javascript
// Views ALL customers from ALL branches
const customers = await pb.collection("users").getFullList({
  filter: 'role = "customer"',
  expand: 'branch_details',
  sort: '-created'
});

// Can filter by:
// - All branches (default)
// - Specific branch ID
// - Unassigned customers (no branch_details)
```

### **Admin**
```javascript
// Views ONLY customers from their assigned branch
const accessibleBranches = getUserAccessibleBranches(user);
const branchFilter = accessibleBranches.map(
  branchId => `branch_details = "${branchId}"`
).join(' || ');

const customers = await pb.collection("users").getFullList({
  filter: `role = "customer" && (${branchFilter})`,
  expand: 'branch_details',
  sort: '-created'
});
```

### **Other Roles**
- Technicians and customers: **No access** to customer list

---

## 📊 Order Statistics Calculation

The system calculates real-time statistics for each customer:

```javascript
// Fetch all orders
const orders = await pb.collection("user_order").getFullList();

// Filter by customer ID
const customerOrders = orders.filter(order => order.user === customer.id);

// Calculate statistics
const stats = {
  total: customerOrders.length,
  completed: customerOrders.filter(o => o.status === 'completed').length,
  pending: customerOrders.filter(o =>
    ['Pending', 'Approved', 'packing', 'ready_for_delivery',
     'on_the_way', 'ready_for_pickup'].includes(o.status)
  ).length,
  cancelled: customerOrders.filter(o =>
    o.status === 'cancelled' || o.status === 'Declined'
  ).length,
  totalSpent: customerOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (o.delivery_fee || 0), 0)
};
```

**Note:** The `totalSpent` calculation currently only includes `delivery_fee`. You may want to enhance this to include product prices when that data becomes available in the order records.

---

## 🎨 UI Components Used

### **Shadcn/ui Components**
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Badge` (for status indicators)
- `Avatar`, `AvatarImage`, `AvatarFallback`
- `Button` (variants: ghost, outline)
- `Input` (search field)
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- `Checkbox` (for row selection)

### **Icons** (Iconify)
- `mdi:account-circle` - Customer icon
- `mdi:loading` - Loading spinner
- `mdi:alert-circle` - Error/warning states
- `mdi:office-building` - Branch icon
- `mdi:cart` - Orders icon
- `mdi:check-circle` - Completed/verified status
- `mdi:clock-outline` - Pending status
- `mdi:close-circle` - Cancelled status
- `mdi:currency-usd` - Money/spending icon

### **Lucide Icons**
- `Users` - Header icon
- `RefreshCw` - Refresh button
- `Eye` - View action button

---

## 🔄 Data Flow

### **Page Load Flow**
```
1. User opens /customers page
   ↓
2. Page component gets user from AuthContext
   ↓
3. CustomerList component receives user prop
   ↓
4. useEffect triggers fetchCustomers()
   ↓
5. getCustomersWithOrderStats(user) called
   ↓
6. Role-based filtering applied
   ↓
7. Order statistics calculated
   ↓
8. Data displayed in DataTable
```

### **Filter Flow**
```
1. User types in search box or selects branch
   ↓
2. State updated (searchQuery or selectedBranch)
   ↓
3. useEffect detects change
   ↓
4. applyFiltersAndPagination() called
   ↓
5. Client-side filtering applied
   ↓
6. Pagination recalculated
   ↓
7. Filtered data displayed
```

### **View Customer Flow**
```
1. User clicks eye icon on customer row
   ↓
2. handleViewCustomer(customer) called
   ↓
3. setViewingCustomer(customer)
   ↓
4. setIsDetailsDialogOpen(true)
   ↓
5. Dialog opens with customer data
   ↓
6. useEffect in dialog fetches customer orders
   ↓
7. Orders displayed in Orders tab
```

---

## 🧪 Testing Checklist

### **Super-Admin Testing**
- [ ] Log in as super-admin
- [ ] Navigate to Customers page
- [ ] Verify all customers from all branches are visible
- [ ] Test search by customer name
- [ ] Test search by customer email
- [ ] Test branch filter dropdown appears
- [ ] Select "All Branches" - verify all customers shown
- [ ] Select specific branch - verify only that branch's customers shown
- [ ] Select "Unassigned" - verify only customers without branch shown
- [ ] Verify Branch column appears in table
- [ ] Click view on a customer
- [ ] Verify all three tabs (Profile, Orders, Statistics) work
- [ ] Verify order statistics are accurate
- [ ] Test pagination if more than 20 customers
- [ ] Test refresh button

### **Admin Testing**
- [ ] Log in as admin with assigned branch
- [ ] Navigate to Customers page
- [ ] Verify only customers from admin's branch visible
- [ ] Verify branch filter dropdown does NOT appear
- [ ] Test search functionality
- [ ] Verify Branch column does NOT appear in table
- [ ] Click view on a customer
- [ ] Verify customer details dialog works
- [ ] Verify order history shows correctly
- [ ] Verify statistics are calculated correctly
- [ ] Test refresh button

### **Edge Cases**
- [ ] Admin with no branch assigned - should see no customers
- [ ] Customer with no orders - statistics should show zeros
- [ ] Customer with no branch - should show "Unassigned" badge (super-admin view)
- [ ] Customer with unverified email - should show "Pending" badge
- [ ] Search with no results - should show "No customers match your filters"
- [ ] Empty customer list - should show "No customers found"

### **Performance Testing**
- [ ] Test with 100+ customers
- [ ] Verify pagination works smoothly
- [ ] Verify search is responsive
- [ ] Verify order statistics calculation doesn't slow down page load
- [ ] Check console for any errors or warnings

---

## 🚀 Future Enhancements

### **1. Enhanced Order Statistics**
Currently, `totalSpent` only includes delivery fees. Consider enhancing to include:
- Product prices from the order
- Detailed breakdown of spending by category
- Average order value
- Last order date

### **2. Customer Actions**
- Edit customer details (admin/super-admin)
- Assign/reassign customer to branch (super-admin)
- Send email to customer
- View customer's service requests
- Export customer list to CSV

### **3. Advanced Filtering**
- Filter by verification status
- Filter by order count range
- Filter by total spending range
- Filter by join date range
- Sort by various columns

### **4. Bulk Operations**
- Select multiple customers
- Bulk assign to branch
- Bulk export
- Bulk email

### **5. Customer Insights**
- Purchase patterns
- Favorite products
- Order frequency
- Customer loyalty score
- Last active date

### **6. Integration with Orders**
- Click on order in customer details to view full order
- Quick create order for customer
- View all orders from customer in Orders page

---

## 📝 Implementation Notes

### **Branch Filtering Logic**
The system uses the existing `roleUtils.js` functions for consistency:
- `canViewAllOrders(userRole)` - Check if super-admin
- `shouldFilterByBranch(userRole)` - Check if admin needs filtering
- `getUserAccessibleBranches(user)` - Get admin's branch ID(s)

### **Customer vs User**
- Customers are users with `role = "customer"`
- The system filters the `users` collection by role
- All user fields are available (avatar, name, email, etc.)
- Branch assignment uses the `branch_details` relation field

### **Order Statistics Performance**
- Statistics are calculated on each fetch
- For large datasets, consider caching or backend aggregation
- Current implementation fetches all orders once, then filters client-side
- May want to move to backend aggregation for better performance

### **Unassigned Customers**
- Customers without `branch_details` relation are considered "unassigned"
- Super-admins can filter specifically for these customers
- Admins cannot see unassigned customers
- Consider adding a workflow to assign customers to branches

---

## 🔗 Related Files

### **Dependencies**
- `/workspaces/utils/roleUtils.js` - Role-based permission utilities
- `/workspaces/context/AuthContext.jsx` - User authentication context
- `/workspaces/lib/pocketbase.js` - PocketBase client instance
- `/workspaces/components/ui/*` - Shadcn/ui components

### **Similar Implementations**
- `/workspaces/app/orders/page.jsx` - Similar structure
- `/workspaces/components/v1/orders/*` - Pattern reference
- `/workspaces/app/branch/page.jsx` - Branch filtering example

### **Navigation**
- `/workspaces/components/v1/SideNavigation.jsx` - Already includes Customers link

---

## ✅ Summary

**Problem:** Need customer management with branch-based visibility control.

**Solution:**
- Created comprehensive customer management system
- Super-admins see all customers with branch filtering
- Admins see only their branch's customers
- Detailed customer profiles with order statistics
- Search and filter capabilities
- Clean, professional UI with Shadcn components

**Files Created:**
1. `/workspaces/services/pocketbase/readCustomers.js` - Service layer
2. `/workspaces/components/v1/customers/Header.jsx` - Header component
3. `/workspaces/components/v1/customers/Filters.jsx` - Filter component
4. `/workspaces/components/v1/customers/DataTable.jsx` - Table component
5. `/workspaces/components/v1/customers/CustomerDetailsDialog.jsx` - Details dialog
6. `/workspaces/components/v1/customers/CustomerList.jsx` - List container
7. `/workspaces/app/customers/page.jsx` - Main page (updated)

**Key Features:**
- ✅ Role-based branch filtering
- ✅ Real-time order statistics
- ✅ Search by name/email
- ✅ Branch filter (super-admin)
- ✅ Customer details with 3 tabs
- ✅ Avatar display with fallbacks
- ✅ Pagination support
- ✅ Responsive design
- ✅ Loading/error states
- ✅ Refresh functionality

**Status:** ✅ Complete and ready for testing

---

**Updated:** October 6, 2025
**Impact:** New feature - No breaking changes
**Testing Required:** Yes - Follow testing checklist above
