import { pb } from "../../lib/pocketbase.js"; // Import pb directly
import { COLLECTION_NAME, _fetchAndFormatOrderById } from "./_common.js";

/**
 * Updates an existing order.
 * @param {string} id Order ID to update.
 * @param {object} updateData App format data for fields to update (e.g., { status: 'Approved', totalPrice: 1500 }).
 * @returns {Promise<object | null>} Formatted updated order or null on failure.
 */
export async function updateOrder(id, updateData) {
  if (!pb) {
    throw new Error("PocketBase client is not initialized.");
  }
  if (!id || !updateData)
    throw new Error("Order ID and update data are required.");
  console.log(`[Update] Updating ${id} in ${COLLECTION_NAME}...`);
  try {
    const pocketBaseUpdateData = {};

    // Map app fields to database fields
    if (updateData.status !== undefined) pocketBaseUpdateData.status = updateData.status;
    if (updateData.paymentType !== undefined) pocketBaseUpdateData.mode_of_payment = updateData.paymentType;
    if (updateData.totalPrice !== undefined) pocketBaseUpdateData.total_price = updateData.totalPrice;
    if (updateData.productIds !== undefined) pocketBaseUpdateData.products = updateData.productIds;
    if (updateData.deliveryInfoId !== undefined) pocketBaseUpdateData.address = updateData.deliveryInfoId;

    // Add requestKey: null to prevent auto-cancellation
    const options = { requestKey: null };

    const updatedRawRecord = await pb
      .collection(COLLECTION_NAME)
      .update(id, pocketBaseUpdateData, options);
    // Fetch again with expansion for consistent formatted return
    const formattedOrder = await _fetchAndFormatOrderById(
      pb,
      updatedRawRecord.id
    ); // Pass pb instance
    return formattedOrder;
  } catch (error) {
    console.error(
      `[Update] Error updating ${id} in ${COLLECTION_NAME}:`,
      error
    );
    if (error.status === 400 && error.data?.data) {
      console.warn("[Update] Validation Errors:", error.data.data);
    }
    return null;
  }
}
