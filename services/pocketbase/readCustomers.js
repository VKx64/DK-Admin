// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";
import { canViewAllOrders, shouldFilterByBranch, getUserAccessibleBranches } from "../../utils/roleUtils";

/**
 * Get customer's last order branch
 * Customers are assigned to the branch of their most recent order
 * @param {string} customerId - Customer's user ID
 * @param {Array} allOrders - Pre-fetched orders array (optional, for performance)
 * @returns {Promise<string|null>} - Branch ID of last order, or null if no orders
 */
async function getCustomerLastOrderBranch(customerId, allOrders = null) {
  try {
    let orders;

    if (allOrders) {
      // Filter from pre-fetched orders for performance
      orders = allOrders.filter(order => order.user === customerId);
    } else {
      // Fetch customer's orders
      orders = await pb.collection("user_order").getFullList({
        filter: `user = "${customerId}"`,
        sort: '-created',
        requestKey: null
      });
    }

    // Get the most recent order's branch
    if (orders.length > 0) {
      return orders[0].branch || null;
    }

    return null;
  } catch (error) {
    console.error(`Error getting last order branch for customer ${customerId}:`, error);
    return null;
  }
}

/**
 * Get all customers (users with role="customer")
 * @returns {Promise<Array>} - Array of customer users
 */
export async function getAllCustomers() {
  try {
    const result = await pb.collection("users").getFullList({
      filter: 'role = "customer"',
      sort: '-created',
      requestKey: null
    });

    console.log(`Retrieved ${result.length} total customers`);
    return result;
  } catch (error) {
    console.error("Error getting all customers:", error);
    throw error;
  }
}

/**
 * Get customers based on user role with branch filtering
 * - Super-admin: sees all customers from all branches
 * - Admin: sees only customers whose last order was from their branch
 * - Other roles: no access
 * @param {Object} user - Current authenticated user
 * @returns {Promise<Array>} - Array of customer users filtered by role
 */
export async function getCustomersByRole(user) {
  try {
    if (!user) {
      throw new Error("User not authenticated");
    }

    const userRole = user.role?.toLowerCase();

    console.log('================================================================================================');
    console.log('CUSTOMER FETCH DEBUG INFO:');
    console.log('User ID:', user.id);
    console.log('User role:', userRole);
    console.log('User branch_details:', user.branch_details);
    console.log('================================================================================================');

    // Fetch all customers first
    let customers = await pb.collection("users").getFullList({
      filter: 'role = "customer"',
      sort: '-created',
      requestKey: null
    });

    // Fetch all orders once for performance
    const allOrders = await pb.collection("user_order").getFullList({
      expand: 'branch',
      sort: '-created',
      requestKey: null
    });

    // Enrich customers with their last order branch
    const customersWithBranch = await Promise.all(
      customers.map(async (customer) => {
        const customerOrders = allOrders.filter(order => order.user === customer.id);
        const lastOrderBranch = customerOrders.length > 0 ? customerOrders[0].branch : null;
        const lastOrderBranchDetails = customerOrders.length > 0 ? customerOrders[0].expand?.branch : null;

        return {
          ...customer,
          lastOrderBranch: lastOrderBranch,
          lastOrderBranchDetails: lastOrderBranchDetails
        };
      })
    );

    // Super-admin can see all customers
    if (canViewAllOrders(userRole)) {
      console.log(`✅ Super-admin retrieved ${customersWithBranch.length} customers from all branches`);
      return customersWithBranch;
    }
    // Admin should only see customers whose last order was from their branch
    else if (shouldFilterByBranch(userRole)) {
      const accessibleBranches = getUserAccessibleBranches(user);

      console.log('Accessible branches for admin:', accessibleBranches);

      if (!accessibleBranches || accessibleBranches.length === 0) {
        console.warn("❌ Admin user has no branch_details assigned or no accessible branches");
        console.warn("This admin will see NO customers due to missing branch assignment");
        return [];
      }

      // Filter customers by their last order branch
      const filteredCustomers = customersWithBranch.filter(customer => {
        return customer.lastOrderBranch && accessibleBranches.includes(customer.lastOrderBranch);
      });

      console.log(`✅ Admin retrieved ${filteredCustomers.length} customers from their branch(es)`);

      // Additional debugging
      if (filteredCustomers.length > 0) {
        const customerBranches = filteredCustomers.map(c => c.lastOrderBranch).filter(Boolean);
        const uniqueBranches = [...new Set(customerBranches)];
        console.log(`📊 Customers found from branches: ${uniqueBranches.join(', ')}`);
      }

      return filteredCustomers;
    }
    // Other roles (technician, customer) cannot access customer list
    else {
      console.warn(`❌ Role '${userRole}' does not have permission to view customers`);
      return [];
    }
  } catch (error) {
    console.error("Error getting customers by role:", error);
    throw error;
  }
}

/**
 * Get customer by ID with their last order branch
 * @param {string} customerId - The customer's user ID
 * @returns {Promise<Object>} - Customer user object with last order branch
 */
export async function getCustomerById(customerId) {
  try {
    const customer = await pb.collection("users").getOne(customerId, {
      requestKey: null
    });

    // Get customer's last order branch
    const lastOrderBranch = await getCustomerLastOrderBranch(customerId);

    // Get branch details if there's a last order branch
    let lastOrderBranchDetails = null;
    if (lastOrderBranch) {
      try {
        lastOrderBranchDetails = await pb.collection("branch_details").getOne(lastOrderBranch, {
          requestKey: null
        });
      } catch (error) {
        console.warn(`Could not fetch branch details for ${lastOrderBranch}:`, error);
      }
    }

    const customerWithBranch = {
      ...customer,
      lastOrderBranch,
      lastOrderBranchDetails
    };

    console.log('Retrieved customer details:', customerWithBranch);
    return customerWithBranch;
  } catch (error) {
    console.error(`Error getting customer with ID ${customerId}:`, error);
    throw error;
  }
}

/**
 * Get customers with their order statistics
 * @param {Object} user - Current authenticated user
 * @returns {Promise<Array>} - Array of customers with order stats
 */
export async function getCustomersWithOrderStats(user) {
  try {
    // First get customers based on role
    const customers = await getCustomersByRole(user);

    // Fetch all orders to calculate statistics
    const orders = await pb.collection("user_order").getFullList({
      requestKey: null
    });

    // Calculate order statistics for each customer
    const customersWithStats = customers.map(customer => {
      const customerOrders = orders.filter(order => order.user === customer.id);

      const totalOrders = customerOrders.length;
      const completedOrders = customerOrders.filter(order => order.status === 'completed').length;
      const pendingOrders = customerOrders.filter(order =>
        ['Pending', 'Approved', 'packing', 'ready_for_delivery', 'on_the_way', 'ready_for_pickup'].includes(order.status)
      ).length;
      const cancelledOrders = customerOrders.filter(order =>
        order.status === 'cancelled' || order.status === 'Declined'
      ).length;

      // Calculate total spent (sum of all completed orders)
      const totalSpent = customerOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => {
          // Calculate order total from products and delivery fee
          const orderTotal = (order.delivery_fee || 0);
          return sum + orderTotal;
        }, 0);

      return {
        ...customer,
        orderStats: {
          total: totalOrders,
          completed: completedOrders,
          pending: pendingOrders,
          cancelled: cancelledOrders,
          totalSpent: totalSpent
        }
      };
    });

    console.log(`Retrieved ${customersWithStats.length} customers with order statistics`);
    return customersWithStats;
  } catch (error) {
    console.error("Error getting customers with order stats:", error);
    throw error;
  }
}

/**
 * Search customers by name or email
 * @param {string} searchQuery - Search term
 * @param {Object} user - Current authenticated user
 * @returns {Promise<Array>} - Array of matching customers
 */
export async function searchCustomers(searchQuery, user) {
  try {
    if (!searchQuery || searchQuery.trim() === '') {
      return getCustomersByRole(user);
    }

    const customers = await getCustomersByRole(user);

    const searchLower = searchQuery.toLowerCase();
    const filtered = customers.filter(customer =>
      (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );

    console.log(`Search for '${searchQuery}' returned ${filtered.length} customers`);
    return filtered;
  } catch (error) {
    console.error("Error searching customers:", error);
    throw error;
  }
}
