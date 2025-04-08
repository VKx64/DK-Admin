import { pb } from "../../lib/pocketbase.js";
import { COLLECTION_NAME, _prepareDataForDeliveryInfo, _formatReceivedDeliveryData } from "./_common.js";

/**
 * Creates a new delivery information record.
 * @param {object} data - Delivery information data.
 * @param {object} [options={}] - Optional parameters.
 * @returns {Promise<object | null>} Formatted created record or null on failure.
 */
export async function createDeliveryInformation(data, options = {}) {
    if (!pb) {
        throw new Error("PocketBase client is not initialized.");
    }

    if (!data) {
        throw new Error("Delivery information data is required.");
    }

    // Input validation
    if (data.phone && typeof data.phone !== 'string') {
        throw new Error("Phone number must be a string.");
    }

    try {
        const preparedData = _prepareDataForDeliveryInfo(data);

        const finalOptions = {
            expand: 'user',  // Always expand user relation
            ...options,
            requestKey: null
        };

        const createdRecord = await pb.collection(COLLECTION_NAME).create(preparedData, finalOptions);
        return _formatReceivedDeliveryData(createdRecord);
    } catch (error) {
        console.error(`[Create] Error creating in ${COLLECTION_NAME}:`, error);
        // Better error handling for user relation issues
        if (error.status === 400 && error.data?.data?.user) {
            console.warn("[Create] User relation error:", error.data.data.user);
        }
        return null;
    }
}
