import { pb } from "../../lib/pocketbase.js";
import { COLLECTION_NAME } from "./_common.js";

export async function deleteDeliveryInformation(id, options = {}) {
    if (!pb) {
        throw new Error("PocketBase client is not initialized.");
    }
    if (!id) throw new Error("Record ID is required.");
    try {
        const finalOptions = {
            ...options,
            requestKey: null
        };
        await pb.collection(COLLECTION_NAME).delete(id, finalOptions);
        return true;
    } catch (error) {
        console.error(`[Delete] Error deleting record ${id} from ${COLLECTION_NAME}:`, error);
        throw error;
    }
}
