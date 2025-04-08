// src/services/cart/delete.js
import { pb } from "../../lib/pocketbase.js"; // Import pb directly
import { COLLECTION_NAME } from "./_common.js";

/**
 * Deletes a cart item.
 * @param {string} id Cart Item ID to delete.
 * @returns {Promise<boolean>} True if successful. Throws error on failure.
 */
export async function deleteCartItem(id) {
  if (!pb) {
    throw new Error("PocketBase client is not initialized.");
  }
  if (!id) throw new Error("Cart Item ID is required.");
  try {
    await pb.collection(COLLECTION_NAME).delete(id);
    return true;
  } catch (error) {
    console.error(
      `[Delete] Error deleting ${id} from ${COLLECTION_NAME}:`,
      error
    );
    throw error;
  }
}
