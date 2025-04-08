// src/services/cart/update.js
import { pb } from "../../lib/pocketbase.js"; // Import pb directly
import { COLLECTION_NAME, _fetchAndFormatCartItemById } from "./_common.js";

/**
 * Updates an existing cart item (typically the quantity).
 * @param {string} id Cart Item ID to update.
 * @param {object} updateData App format data, e.g., { quantity: 5 }.
 * @returns {Promise<object | null>} Formatted updated item or null on failure.
 */
export async function updateCartItem(id, updateData) {
  if (!pb) {
    throw new Error("PocketBase client is not initialized.");
  }
  if (!id || !updateData || updateData.quantity === undefined) {
    throw new Error("Cart Item ID and update data with quantity are required.");
  }
  try {
    const pocketBaseUpdateData = { quantity: updateData.quantity };
    const updatedRawRecord = await pb
      .collection(COLLECTION_NAME)
      .update(id, pocketBaseUpdateData);
    const formattedItem = await _fetchAndFormatCartItemById(
      pb,
      updatedRawRecord.id
    ); // Pass pb
    return formattedItem;
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
