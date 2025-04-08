// src/services/products/update.js
import { pb } from "../../lib/pocketbase.js";
import { COLLECTION_NAME, _prepareDataForProduct } from "./_common.js";
// Import the detailed fetch function from read.js
import { getProductDetailsById } from "./read.js";

/**
 * Updates an existing product (handles file upload/removal).
 * Returns the fully detailed and formatted product object.
 * @param {string} id Product ID to update.
 * @param {object} updateData App format data for fields to update { name?, model?, brand?, imageFile?: File|null }.
 * @returns {Promise<object | null>} Formatted updated product with details, or null on failure.
 */
export async function updateProduct(id, updateData) {
  if (!pb) {
    throw new Error("PocketBase client is not initialized.");
  }
  if (!id || !updateData)
    throw new Error("Product ID and update data are required.");
  // console.log(`[Update] Updating ${id} in ${COLLECTION_NAME}...`);
  try {
    const pocketBaseUpdateData = _prepareDataForProduct(updateData);
    const updatedRawRecord = await pb
      .collection(COLLECTION_NAME)
      .update(id, pocketBaseUpdateData, { requestKey: null });
    // Fetch the full details using the updated function for consistent return
    const formattedProduct = await getProductDetailsById(updatedRawRecord.id);
    return formattedProduct;
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
