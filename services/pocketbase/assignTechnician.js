// Import the PocketBase client
import pb from "../pocketbase";

/**
 * Assign a technician to an order (for COD orders)
 * @param {string} orderId - The ID of the order
 * @param {string} technicianId - The ID of the technician to assign (or null to unassign)
 * @returns {Promise<Object>} The updated order object
 */
export async function assignTechnicianToOrder(orderId, technicianId) {
  try {
    console.log(`Assigning technician ${technicianId} to order ${orderId}`);

    // Update the order with the assigned technician
    const data = {
      assigned_technician: technicianId === 'unassign' ? null : technicianId
    };

    const updatedOrder = await pb.collection('user_order').update(orderId, data);

    console.log('Technician assigned successfully:', updatedOrder);
    return updatedOrder;
  } catch (error) {
    console.error('Error assigning technician to order:', error);
    throw error;
  }
}

/**
 * Update order with delivery proof
 * @param {string} orderId - The ID of the order
 * @param {File} proofImage - The image file for proof of delivery
 * @param {string} notes - Optional delivery notes
 * @returns {Promise<Object>} The updated order object
 */
export async function submitDeliveryProof(orderId, proofImage, notes = '') {
  try {
    console.log(`Submitting delivery proof for order ${orderId}`);

    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append('delivery_proof_image', proofImage);
    formData.append('delivery_notes', notes);
    formData.append('delivery_completed_date', new Date().toISOString());
    formData.append('status', 'completed');

    const updatedOrder = await pb.collection('user_order').update(orderId, formData);

    console.log('Delivery proof submitted successfully:', updatedOrder);
    return updatedOrder;
  } catch (error) {
    console.error('Error submitting delivery proof:', error);
    throw error;
  }
}

/**
 * Get orders assigned to a specific technician
 * @param {string} technicianId - The ID of the technician
 * @param {string} status - Optional status filter (e.g., 'ready_for_delivery', 'on_the_way')
 * @returns {Promise<Array>} Array of orders assigned to the technician
 */
export async function getOrdersForTechnician(technicianId, status = null) {
  try {
    console.log(`Fetching orders for technician ${technicianId}`);

    let filter = `assigned_technician = "${technicianId}"`;

    if (status) {
      filter += ` && status = "${status}"`;
    }

    const orders = await pb.collection('user_order').getFullList({
      filter: filter,
      sort: '-created',
      expand: 'user,address,products,branch',
      requestKey: null
    });

    console.log(`Retrieved ${orders.length} orders for technician`);
    return orders;
  } catch (error) {
    console.error('Error fetching orders for technician:', error);
    throw error;
  }
}

/**
 * Get all COD orders that need technician assignment
 * @returns {Promise<Array>} Array of COD orders without assigned technician
 */
export async function getCODOrdersNeedingAssignment() {
  try {
    console.log('Fetching COD orders needing technician assignment');

    const orders = await pb.collection('user_order').getFullList({
      filter: 'mode_of_payment = "Cash On Delivery" && assigned_technician = null && (status = "ready_for_delivery" || status = "Approved")',
      sort: '-created',
      expand: 'user,address,products,branch',
      requestKey: null
    });

    console.log(`Retrieved ${orders.length} COD orders needing assignment`);
    return orders;
  } catch (error) {
    console.error('Error fetching COD orders:', error);
    throw error;
  }
}
