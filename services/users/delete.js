import { pb } from '../../lib/pocketbase.js'; // Import pb directly
import { COLLECTION_NAME } from './_common.js';

/**
 * Deletes a user.
 */
export async function deleteUser(id) {
    if (!pb) { throw new Error("PocketBase client is not initialized."); }
    if (!id) throw new Error('User ID is required.');
    console.log(`[Delete] Deleting ${id} from ${COLLECTION_NAME}...`);
    try {
        await pb.collection(COLLECTION_NAME).delete(id);
        return true;
    } catch (error) {
        console.error(`[Delete] Error deleting ${id} from ${COLLECTION_NAME}:`, error);
        throw error;
    }
}
