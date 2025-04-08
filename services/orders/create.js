// src/services/orders/create.js
import { pb } from "../../lib/pocketbase.js"; // Import pb directly
import {
  COLLECTION_NAME,
  _prepareDataForPocketBase,
  _fetchAndFormatOrderById, // Use the shared fetcher
} from "./_common.js";

/**
 * Creates a new order using application data format.
 * @param {object} orderInputData App format: { productIds:[], paymentType:'', deliveryInfoId:'', totalPrice:0, userId:'' }.
 *                               Note: deliveryInfoId is optional
 * @param {object} [options={}] - Optional parameters.
 * @returns {Promise<object | null>} Formatted created order or null on failure.
 */
export async function createOrder(orderInputData, options = {}) {
  if (!pb) {
    throw new Error("PocketBase client is not initialized.");
  }
  if (!orderInputData) throw new Error("Order input data is required.");

  // Input validation
  if (!Array.isArray(orderInputData.productIds) || orderInputData.productIds.length === 0) {
    throw new Error("Product IDs must be a non-empty array.");
  }

  // Removed the deliveryInfoId validation check to make it optional

  if (!orderInputData.userId) {
    throw new Error("User ID is required.");
  }

  console.log(`[Create] Creating in ${COLLECTION_NAME}...`);
  try {
    const pocketBaseData = _prepareDataForPocketBase(orderInputData);

    // Add requestKey: null to options to prevent auto-cancellation
    const finalOptions = {
      ...options,
      requestKey: null
    };

    const createdRawRecord = await pb
      .collection(COLLECTION_NAME)
      .create(pocketBaseData, finalOptions);
    // Fetch again with expansion for consistent formatted return
    const formattedOrder = await _fetchAndFormatOrderById(
      pb,
      createdRawRecord.id
    ); // Pass pb instance
    return formattedOrder;
  } catch (error) {
    console.error(`[Create] Error creating in ${COLLECTION_NAME}:`, error);
    if (error.status === 400 && error.data?.data) {
      console.warn("[Create] Validation Errors:", error.data.data);
    }
    return null;
  }
}
