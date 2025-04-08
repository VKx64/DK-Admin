// src/services/cart/read.js
import { pb } from "../../lib/pocketbase.js"; // Import pb directly
import { COLLECTION_NAME, EXPAND_PRODUCT_FIELD, EXPAND_USER_FIELD, _formatReceivedCartItem } from "./_common.js";

/**
 * Fetches and formats a list of cart items.
 * @param {number} [page=1] - The page number to retrieve.
 * @param {number} [perPage=30] - The number of records per page.
 * @param {object} [options={}] - PocketBase SDK options (filter, sort, expand).
 * @returns {Promise<{ items: Array<object>, totalItems: number, totalPages: number, page: number }>}
 */
export async function getCartItems(page = 1, perPage = 30, options = {}) {
  if (!pb) {
    throw new Error("PocketBase client is not initialized.");
  }
  try {
    // Ensure we're expanding product and user fields by default
    const finalOptions = {
      ...options,
      expand: options.expand || `${EXPAND_PRODUCT_FIELD},${EXPAND_USER_FIELD}`,
      requestKey: null // prevent auto cancellation of the request
    };

    const rawResultList = await pb
      .collection(COLLECTION_NAME)
      .getList(page, perPage, finalOptions);

    const formattedItems = rawResultList.items
      .map((item) => _formatReceivedCartItem(item, pb))
      .filter(Boolean); // Pass pb
    return { ...rawResultList, items: formattedItems };
  } catch (error) {
    console.error(`[Read:List] Error fetching ${COLLECTION_NAME}:`, error);
    throw error;
  }
}

/**
 * Fetches and formats a single cart item by ID.
 * @param {string} id - Cart Item ID.
 * @param {object} [options={}] - PocketBase SDK options.
 * @returns {Promise<object | null>} Formatted cart item or null if not found.
 */
export async function getCartItemById(id, options = {}) {
  if (!pb) {
    throw new Error("PocketBase client is not initialized.");
  }
  if (!id) throw new Error("Cart Item ID is required.");
  try {
    // Ensure we're expanding product and user fields by default
    const finalOptions = {
      ...options,
      expand: options.expand || `${EXPAND_PRODUCT_FIELD},${EXPAND_USER_FIELD}`,
      requestKey: null // prevent auto cancellation of the request
    };

    const rawRecord = await pb.collection(COLLECTION_NAME).getOne(id, finalOptions);
    return _formatReceivedCartItem(rawRecord, pb); // Pass pb
  } catch (error) {
    if (error.status === 404) return null;
    console.error(
      `[Read:One] Error fetching ${id} from ${COLLECTION_NAME}:`,
      error
    );
    throw error;
  }
}

/**
 * Fetches all cart items for a specific user.
 * @param {string} userId - User ID to fetch cart items for.
 * @param {object} [options={}] - Additional PocketBase options.
 * @returns {Promise<Array<object>>} Array of formatted cart items.
 */
export async function getCartItemsByUserId(userId, options = {}) {
  if (!pb) {
    throw new Error("PocketBase client is not initialized.");
  }
  if (!userId) throw new Error("User ID is required.");

  try {
    const finalOptions = {
      ...options,
      filter: `user="${userId}"`,
      expand: options.expand || `${EXPAND_PRODUCT_FIELD},${EXPAND_USER_FIELD}`,
      requestKey: null // prevent auto cancellation of the request
    };

    const resultList = await pb.collection(COLLECTION_NAME).getList(1, 100, finalOptions);
    return resultList.items
      .map(item => _formatReceivedCartItem(item, pb))
      .filter(Boolean);
  } catch (error) {
    console.error(`[Read:UserCart] Error fetching cart for user ${userId}:`, error);
    throw error;
  }
}
