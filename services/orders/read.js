// src/services/orders/read.js
import { pb } from '../../lib/pocketbase.js'; // Import pb directly
import { COLLECTION_NAME, EXPAND_PRODUCTS_FIELD, EXPAND_ADDRESS_FIELD, _formatReceivedOrderData } from './_common.js';

/**
 * Fetches and formats a list of orders.
 * @param {number} [page=1] - The page number to retrieve.
 * @param {number} [perPage=20] - The number of records per page.
 * @param {object} [options={}] - PocketBase SDK options.
 * @returns {Promise<{ items: Array<object>, totalItems: number, totalPages: number, page: number }>}
 */
export async function getOrders(page = 1, perPage = 20, options = {}) {
    if (!pb) { throw new Error("PocketBase client is not initialized."); }
    console.log(`[Read:List] Fetching ${COLLECTION_NAME}, page ${page}, options:`, options);
    try {
        // Add expand and requestKey options
        const finalOptions = {
            expand: `${EXPAND_PRODUCTS_FIELD},${EXPAND_ADDRESS_FIELD}`,
            ...options,
            requestKey: null
        };

        const rawResultList = await pb.collection(COLLECTION_NAME).getList(page, perPage, finalOptions);
        const formattedItems = rawResultList.items.map(_formatReceivedOrderData).filter(Boolean);
        return { ...rawResultList, items: formattedItems };
    } catch (error) {
        console.error(`[Read:List] Error fetching ${COLLECTION_NAME}:`, error);
        throw error;
    }
}

/**
 * Fetches and formats a single order by ID.
 * @param {string} id - Order ID.
 * @param {object} [options={}] - PocketBase SDK options.
 * @returns {Promise<object | null>} Formatted order object or null if not found.
 */
export async function getOrderById(id, options = {}) {
    if (!pb) { throw new Error("PocketBase client is not initialized."); }
    if (!id) throw new Error('Order ID is required.');
    console.log(`[Read:One] Fetching ${id} from ${COLLECTION_NAME}, options:`, options);
    try {
        // Add expand and requestKey options
        const finalOptions = {
            expand: `${EXPAND_PRODUCTS_FIELD},${EXPAND_ADDRESS_FIELD}`,
            ...options,
            requestKey: null
        };

        const rawRecord = await pb.collection(COLLECTION_NAME).getOne(id, finalOptions);
        return _formatReceivedOrderData(rawRecord);
    } catch (error) {
        if (error.status === 404) return null;
        console.error(`[Read:One] Error fetching ${id} from ${COLLECTION_NAME}:`, error);
        throw error;
    }
}

/**
 * Gets all orders for a specific user.
 * @param {string} userId - The user ID to fetch orders for.
 * @param {object} [options={}] - Optional parameters.
 * @returns {Promise<Array<object>>} - Array of formatted order records.
 */
export async function getOrdersByUser(userId, options = {}) {
    if (!pb) { throw new Error("PocketBase client is not initialized."); }
    if (!userId) throw new Error("User ID is required.");

    try {
        const finalOptions = {
            filter: `user = "${userId}"`,
            expand: `${EXPAND_PRODUCTS_FIELD},${EXPAND_ADDRESS_FIELD}`,
            sort: '-created',
            ...options,
            requestKey: null
        };

        const result = await pb.collection(COLLECTION_NAME).getList(1, 100, finalOptions);
        return result.items.map(_formatReceivedOrderData).filter(Boolean);
    } catch (error) {
        console.error(`[Read:UserOrders] Error fetching orders for user ${userId}:`, error);
        return [];
    }
}