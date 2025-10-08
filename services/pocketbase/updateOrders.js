// Import the PocketBase client from services folder
import pb from "../pocketbase";

// FUNCTION TO UPDATE BASIC ORDER INFORMATION
export async function updateOrder(id, orderData) {
  try {
    console.log(`Updating order ${id} with data:`, orderData);

    // Update the order with the new data
    const updatedOrder = await pb.collection("user_order").update(id, orderData, {
      requestKey: null
    });

    console.log('================================================================================================');
    console.log('Updated order:', updatedOrder);
    console.log('Order ID:', updatedOrder.id);
    console.log('Order status:', updatedOrder.status);
    console.log('================================================================================================');

    return updatedOrder;
  } catch (error) {
    console.error(`Error updating order ${id}:`, error);
    throw error;
  }
}

// FUNCTION TO UPDATE ORDER STATUS
export async function updateOrderStatus(orderId, newStatus) {
  try {
    console.log(`Updating order ${orderId} status to: ${newStatus}`);

    // Validate status
    const validStatuses = [
      "Pending",
      "Declined",
      "Approved",
      "packing",
      "ready_for_delivery",
      "on_the_way",
      "completed",
      "ready_for_pickup"
    ];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(", ")}`);
    }

    // Update the order status
    const updatedOrder = await pb.collection("user_order").update(orderId, {
      status: newStatus
    }, {
      requestKey: null
    });

    console.log('================================================================================================');
    console.log('Updated order status:', updatedOrder);
    console.log('Order ID:', updatedOrder.id);
    console.log('New status:', updatedOrder.status);
    console.log('================================================================================================');

    return updatedOrder;
  } catch (error) {
    console.error(`Error updating status for order ${orderId}:`, error);
    throw error;
  }
}

// FUNCTION TO UPDATE MULTIPLE ORDERS' STATUS
export async function updateBatchOrdersStatus(orderIds, newStatus) {
  try {
    console.log(`Updating status for multiple orders to ${newStatus}`);

    // Validate inputs
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error("No valid order IDs provided");
    }

    const validStatuses = [
      "Pending",
      "Declined",
      "Approved",
      "packing",
      "ready_for_delivery",
      "on_the_way",
      "completed",
      "ready_for_pickup"
    ];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(", ")}`);
    }

    const results = {
      successCount: 0,
      failedCount: 0,
      failedIds: []
    };

    // Process each order update
    for (const id of orderIds) {
      try {
        await pb.collection("user_order").update(id, { status: newStatus }, {
          requestKey: null
        });
        results.successCount++;
      } catch (error) {
        console.error(`Error updating order ${id}:`, error);
        results.failedCount++;
        results.failedIds.push(id);
      }
    }

    console.log('================================================================================================');
    console.log(`Batch update completed: ${results.successCount} succeeded, ${results.failedCount} failed`);
    console.log('Failed IDs:', results.failedIds);
    console.log('================================================================================================');

    if (results.failedCount > 0) {
      throw new Error(`${results.failedCount} orders failed to update`);
    }

    return results;
  } catch (error) {
    console.error("Error in batch order status update:", error);
    throw error;
  }
}

// FUNCTION TO ASSIGN TECHNICIAN TO ORDER
export async function assignTechnicianToOrder(orderId, technicianId) {
  try {
    console.log(`Assigning technician ${technicianId} to order ${orderId}`);

    // Update the order with the assigned technician
    const updatedOrder = await pb.collection("user_order").update(orderId, {
      assigned_technician: technicianId
    }, {
      requestKey: null
    });

    console.log('================================================================================================');
    console.log('Updated order with technician:', updatedOrder);
    console.log('Order ID:', updatedOrder.id);
    console.log('Assigned technician:', updatedOrder.assigned_technician);
    console.log('================================================================================================');

    return updatedOrder;
  } catch (error) {
    console.error(`Error assigning technician to order ${orderId}:`, error);
    throw error;
  }
}

// FUNCTION TO CHECK IF TECHNICIAN HAS INCOMPLETE DELIVERIES
export async function checkTechnicianAvailability(technicianId) {
  try {
    console.log(`Checking availability for technician ${technicianId}`);

    // Fetch orders assigned to this technician that are not completed
    const incompleteOrders = await pb.collection("user_order").getFullList({
      filter: `assigned_technician = "${technicianId}" && status != "completed" && status != "Declined" && status != "ready_for_pickup"`,
      requestKey: null
    });

    const isAvailable = incompleteOrders.length === 0;

    console.log('================================================================================================');
    console.log(`Technician ${technicianId} has ${incompleteOrders.length} incomplete deliveries`);
    console.log('Is available:', isAvailable);
    if (!isAvailable) {
      console.log('Incomplete orders:', incompleteOrders.map(o => o.id));
    }
    console.log('================================================================================================');

    return {
      isAvailable,
      incompleteCount: incompleteOrders.length,
      incompleteOrders
    };
  } catch (error) {
    console.error(`Error checking technician availability for ${technicianId}:`, error);
    throw error;
  }
}
