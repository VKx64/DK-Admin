// src/services/products/create.js
import { pb } from "../../lib/pocketbase.js";
import { COLLECTION_NAME, _prepareDataForProduct } from "./_common.js";
// Import the detailed fetch function from read.js
import { getProductDetailsById } from "./read.js";

/**
 * Creates a new product using application data format (handles file upload).
 * Returns the fully detailed and formatted product object.
 * @param {object} productInputData App format: { name:'', model:'', brand:'', imageFile: File|null }.
 * @param {object} [options={}] - Optional parameters.
 * @returns {Promise<object | null>} Formatted created product with details, or null on failure.
 */
export async function createProduct(productInputData, options = {}) {
  if (!pb) {
    throw new Error("PocketBase client is not initialized.");
  }
  if (!productInputData) throw new Error("Product input data is required.");

  // Input validation example (can be expanded)
  if (productInputData.name && typeof productInputData.name !== 'string') {
    throw new Error("Product name must be a string.");
  }

  try {
    const pocketBaseData = _prepareDataForProduct(productInputData);
    const finalOptions = {
      ...options,
      requestKey: null // prevent auto cancellation
    };
    const createdRawRecord = await pb
      .collection(COLLECTION_NAME)
      .create(pocketBaseData, finalOptions);
    // Fetch the full details using the updated function for consistent return
    const formattedProduct = await getProductDetailsById(createdRawRecord.id);
    return formattedProduct;
  } catch (error) {
    console.error(`[Create] Error creating in ${COLLECTION_NAME}:`, error);
    if (error.status === 400 && error.data?.data) {
      console.warn("[Create] Validation Errors:", error.data.data);
    }
    return null;
  }
}
