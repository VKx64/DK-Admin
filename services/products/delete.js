// src/services/products/delete.js
import { pb } from "../../lib/pocketbase.js";
import { COLLECTION_NAME } from "./_common.js";

/**
 * Deletes a product.
 * @param {string} id Product ID to delete.
 * @returns {Promise<boolean>} True if successful. Throws error on failure.
 */
export async function deleteProduct(id) {
  if (!pb) {
    throw new Error("PocketBase client is not initialized.");
  }
  if (!id) throw new Error("Product ID is required.");
  // console.log(`[Delete] Deleting ${id} from ${COLLECTION_NAME}...`);
  try {
    await pb.collection(COLLECTION_NAME).delete(id, { requestKey: null });
    return true;
  } catch (error) {
    console.error(
      `[Delete] Error deleting ${id} from ${COLLECTION_NAME}:`,
      error
    );
    throw error;
  }
}
