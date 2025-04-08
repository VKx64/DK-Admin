// src/services/cart/create.js
import { pb } from "../../lib/pocketbase.js"; // Import pb directly
import {
  COLLECTION_NAME,
  _prepareDataForCartItem,
  _fetchAndFormatCartItemById,
} from "./_common.js";

/**
 * Creates a new cart item using application data format.
 * @param {object} cartItemInputData App format: { productId:'', userId:'', quantity: 1 }.
 * @param {object} [options={}] - Optional parameters.
 * @returns {Promise<object | null>} Formatted created item or null on failure.
 */
export async function createCartItem(cartItemInputData, options = {}) {
  if (!pb) {
    throw new Error("PocketBase client is not initialized.");
  }
  if (!cartItemInputData) throw new Error("Cart item input data is required.");

    // Input validation example (can be expanded)
    if (typeof cartItemInputData.quantity !== 'number') {
        throw new Error("Quantity must be a number.");
    }

  try {
    const pocketBaseData = _prepareDataForCartItem(cartItemInputData);
    const createdRawRecord = await pb
      .collection(COLLECTION_NAME)
      .create(pocketBaseData, options);
    const formattedItem = await _fetchAndFormatCartItemById(
      pb,
      createdRawRecord.id
    ); // Pass pb
    return formattedItem;
  } catch (error) {
    console.error(`[Create] Error creating in ${COLLECTION_NAME}:`, error);
    if (error.status === 400 && error.data?.data) {
      console.warn("[Create] Validation Errors:", error.data.data);
    }
    return null;
  }
}
