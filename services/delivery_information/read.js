import { pb } from "../../lib/pocketbase.js";
import { COLLECTION_NAME, _formatReceivedDeliveryData } from "./_common.js";

/**
 * Fetches a list of delivery information records.
 * @param {number} [page=1] - The page number to retrieve.
 * @param {number} [perPage=20] - The number of records per page.
 * @param {object} [options={}] - PocketBase list options.
 * @returns {Promise<{ items: Array<object>, totalItems: number, totalPages: number, page: number }>} - An object containing the items and pagination information.
 */
export async function getDeliveryInformations(page = 1, perPage = 20, options = {}) {
    if (!pb) {
        throw new Error("PocketBase client is not initialized.");
    }
    try {
        const finalOptions = {
            expand: 'user',  // Always expand user relation by default
            ...options,
            requestKey: null
        };
        const result = await pb.collection(COLLECTION_NAME).getList(page, perPage, finalOptions);
        const formattedItems = result.items.map(item => _formatReceivedDeliveryData(item)).filter(Boolean);
        return { ...result, items: formattedItems };
    } catch (error) {
        console.error(`[Read:List] Error fetching ${COLLECTION_NAME}:`, error);
        throw error;
    }
}

/**
 * Fetches a single delivery information record by ID.
 * @param {string} id - The ID of the delivery information record to retrieve.
 * @param {object} [options={}] - Optional parameters.
 * @returns {Promise<object | null>} - The formatted delivery information record, or null if not found.
 */
export async function getDeliveryInformationById(id, options = {}) {
    if (!pb) {
        throw new Error("PocketBase client is not initialized.");
    }
    if (!id) throw new Error("Record ID is required.");
    try {
        const finalOptions = {
            expand: 'user',  // Always expand user relation by default
            ...options,
            requestKey: null
        };
        const record = await pb.collection(COLLECTION_NAME).getOne(id, finalOptions);
        return _formatReceivedDeliveryData(record);
    } catch (error) {
        if (error?.status === 404) return null;
        console.error(`[Read:Details] Error fetching record ${id} from ${COLLECTION_NAME}:`, error);
        throw error;
    }
}

/**
 * Gets all delivery information for a specific user.
 * @param {string} userId - The user ID to fetch delivery information for.
 * @param {object} [options={}] - Optional parameters.
 * @returns {Promise<Array<object>>} - Array of formatted delivery information records.
 */
export async function getDeliveryInformationByUser(userId, options = {}) {
    if (!pb) {
        throw new Error("PocketBase client is not initialized.");
    }
    if (!userId) throw new Error("User ID is required.");

    try {
        const finalOptions = {
            filter: `user = "${userId}"`,
            expand: 'user',
            ...options,
            requestKey: null
        };

        const result = await pb.collection(COLLECTION_NAME).getList(1, 100, finalOptions);
        return result.items.map(item => _formatReceivedDeliveryData(item)).filter(Boolean);
    } catch (error) {
        console.error(`[Read:UserAddresses] Error fetching addresses for user ${userId}:`, error);
        return [];
    }
}
