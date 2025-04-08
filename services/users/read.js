// src/services/users/read.js
import { pb } from '../../lib/pocketbase.js'; // Import pb directly
import { COLLECTION_NAME, _formatReceivedUserData } from './_common.js';

/**
 * Fetches and formats a list of users.
 */
export async function getUsers(page = 1, perPage = 20, options = {}) {
    if (!pb) { throw new Error("PocketBase client is not initialized."); }
    console.log(`[Read:List] Fetching ${COLLECTION_NAME}, page ${page}, options:`, options);
    try {
        const rawResultList = await pb.collection(COLLECTION_NAME).getList(page, perPage, options);
        const formattedItems = rawResultList.items.map(_formatReceivedUserData).filter(Boolean);
        return { ...rawResultList, items: formattedItems };
    } catch (error) {
        console.error(`[Read:List] Error fetching ${COLLECTION_NAME}:`, error);
        throw error;
    }
}

/**
 * Fetches and formats a single user by ID.
 */
export async function getUserById(id, options = {}) {
    if (!pb) { throw new Error("PocketBase client is not initialized."); }
    if (!id) throw new Error('User ID is required.');
    console.log(`[Read:One] Fetching ${id} from ${COLLECTION_NAME}, options:`, options);
    try {
        const rawRecord = await pb.collection(COLLECTION_NAME).getOne(id, options);
        return _formatReceivedUserData(rawRecord);
    } catch (error) {
        if (error.status === 404) return null;
        console.error(`[Read:One] Error fetching ${id} from ${COLLECTION_NAME}:`, error);
        throw error;
    }
}
