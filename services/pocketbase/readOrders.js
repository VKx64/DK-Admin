// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";
import { canViewAllOrders, shouldFilterByBranch, getUserAccessibleBranches } from "../../utils/roleUtils";

// FUNCTION TO GET ALL ORDERS
export async function getAllOrders() {
  try {
    // Fetch all orders with expanded relations
    const result = await pb.collection("user_order").getFullList({
      expand: 'user,address,branch,assigned_technician,products,product_pricing',
      requestKey: null
    });

    // Log the total number of orders retrieved
    console.log(`Retrieved ${result.length} orders total`);

    // Log detailed information about the first order for debugging
    if (result.length > 0) {
      const firstOrder = result[0];
      console.log('================================================================================================');
      console.log('First order details:', firstOrder);
      console.log('First order ID:', firstOrder.id);
      console.log('First order expanded user:', firstOrder.expand?.user);
      console.log('First order expanded address:', firstOrder.expand?.address);
      console.log('First order expanded branch:', firstOrder.expand?.branch);
      console.log('================================================================================================');
    }

    return result;
  } catch (error) {
    console.error("Error getting orders:", error);
    throw error;
  }
}

// FUNCTION TO GET ORDERS BASED ON USER ROLE
export async function getOrdersByRole(user) {
  try {
    let result = [];

    if (!user) {
      throw new Error("User not authenticated");
    }

    const userRole = user.role?.toLowerCase();

    // Enhanced debugging for user data
    console.log('================================================================================================');
    console.log('USER DEBUG INFO:');
    console.log('User ID:', user.id);
    console.log('User role:', userRole);
    console.log('User branch_details (direct):', user.branch_details);
    console.log('User expanded branch_details:', user.expand?.branch_details);
    console.log('Full user object keys:', Object.keys(user));
    console.log('================================================================================================');

    // Super-admin can see all orders
    if (canViewAllOrders(userRole)) {
      result = await pb.collection("user_order").getFullList({
        expand: 'user,address,branch,assigned_technician,products,product_pricing',
        requestKey: null
      });
      console.log(`✅ Super-admin retrieved ${result.length} orders from all branches`);
    }
    // Admin should only see orders from their assigned branch
    else if (shouldFilterByBranch(userRole)) {
      // Get the user's accessible branches
      const accessibleBranches = getUserAccessibleBranches(user);

      console.log('Accessible branches for admin:', accessibleBranches);

      if (!accessibleBranches || accessibleBranches.length === 0) {
        console.warn("❌ Admin user has no branch_details assigned or no accessible branches");
        console.warn("This admin will see NO orders due to missing branch assignment");
        return [];
      }

      // Create filter for the admin's assigned branch(es)
      const branchFilter = accessibleBranches.map(branchId => `branch = "${branchId}"`).join(' || ');

      console.log(`🔍 Admin filtering orders by branch(es): ${accessibleBranches.join(', ')}`);
      console.log(`🔍 PocketBase filter: ${branchFilter}`);

      result = await pb.collection("user_order").getFullList({
        filter: branchFilter,
        expand: 'user,address,branch,assigned_technician,products,product_pricing',
        requestKey: null
      });

      console.log(`✅ Admin retrieved ${result.length} orders from their branch(es)`);

      // Additional debugging: show which branches the retrieved orders belong to
      if (result.length > 0) {
        const orderBranches = result.map(order => order.branch).filter(Boolean);
        const uniqueBranches = [...new Set(orderBranches)];
        console.log(`📊 Orders found from branches: ${uniqueBranches.join(', ')}`);
      }
    }
    // Other roles (customer, technician) can only see their own orders
    else {
      result = await pb.collection("user_order").getFullList({
        filter: `user = "${user.id}"`,
        expand: 'user,address,branch,assigned_technician,products,product_pricing',
        requestKey: null
      });
      console.log(`✅ User role '${userRole}' retrieved ${result.length} personal orders`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error getting orders by role:", error);
    throw error;
  }
}
