// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// FUNCTION TO GET ALL ORDERS
export async function getAllOrders() {
  try {
    // Fetch all orders with expanded relations
    const result = await pb.collection("user_order").getFullList({
      expand: 'user,address,branch',
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

    if (userRole === 'super-admin') {
      // Super-admin can see all orders with branch information
      result = await pb.collection("user_order").getFullList({
        expand: 'user,address,branch',
        requestKey: null
      });
    } else if (userRole === 'admin') {
      // Admin can only see orders from their assigned branch
      // Get the authenticated user's branch details from authStore
      const authUser = pb.authStore.model;

      if (!authUser || !authUser.branch_details) {
        console.warn("Admin user has no branch_details assigned");
        return [];
      }

      // Fetch orders filtered by the admin's branch
      result = await pb.collection("user_order").getFullList({
        filter: `branch = "${authUser.branch_details}"`,
        expand: 'user,address,branch',
        requestKey: null
      });

      console.log(`Admin filtering orders by branch: ${authUser.branch_details}`);
    } else {
      // Other roles (customer, technician) can only see their own orders
      result = await pb.collection("user_order").getFullList({
        filter: `user = "${user.id}"`,
        expand: 'user,address,branch',
        requestKey: null
      });
    }

    // Log the total number of orders retrieved for this role
    console.log(`Retrieved ${result.length} orders for role: ${userRole}`);

    // Log detailed information about the first order for debugging
    if (result.length > 0) {
      const firstOrder = result[0];
      console.log('================================================================================================');
      console.log('First filtered order details:', firstOrder);
      console.log('First order ID:', firstOrder.id);
      console.log('First order expanded user:', firstOrder.expand?.user);
      console.log('First order expanded address:', firstOrder.expand?.address);
      console.log('First order expanded branch:', firstOrder.expand?.branch);
      console.log('User role:', userRole);
      console.log('AuthStore user branch_details:', pb.authStore.model?.branch_details);
      console.log('================================================================================================');
    }

    return result;
  } catch (error) {
    console.error("Error getting orders by role:", error);
    throw error;
  }
}
