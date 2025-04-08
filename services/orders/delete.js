import { pb } from '../../lib/pocketbase.js'; // Import pb directly
import { COLLECTION_NAME } from './_common.js';

/**
 * Deletes an order.
 * @param {string} id Order ID to delete.
 * @returns {Promise<boolean>} True if successful. Throws error on failure.
 */
export async function deleteOrder(id) {
    if (!pb) { throw new Error("PocketBase client is not initialized."); }
    if (!id) throw new Error('Order ID is required.');
    console.log(`[Delete] Deleting ${id} from ${COLLECTION_NAME}...`);
    try {
        // Add requestKey: null to prevent auto-cancellation
        const options = { requestKey: null };

        await pb.collection(COLLECTION_NAME).delete(id, options);
        return true;
    } catch (error) {
        console.error(`[Delete] Error deleting ${id} from ${COLLECTION_NAME}:`, error);
        throw error;
    }
}