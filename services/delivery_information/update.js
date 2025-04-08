import { pb } from "../../lib/pocketbase.js";
import { COLLECTION_NAME, _prepareDataForDeliveryInfo } from "./_common.js";
import { getDeliveryInformationById } from "./read.js";

export async function updateDeliveryInformation(id, updateData, options = {}) {
    if (!pb) {
        throw new Error("PocketBase client is not initialized.");
    }
    if (!id || !updateData) throw new Error("Record ID and update data are required.");
    try {
        const preparedData = _prepareDataForDeliveryInfo(updateData);
        const finalOptions = {
            ...options,
            requestKey: null
        };
        await pb.collection(COLLECTION_NAME).update(id, preparedData, finalOptions);
        return await getDeliveryInformationById(id);
    } catch (error) {
        console.error(`[Update] Error updating record ${id} in ${COLLECTION_NAME}:`, error);
        return null;
    }
}
