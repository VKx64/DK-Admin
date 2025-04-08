import { pb } from "../../lib/pocketbase.js"; // Import pb directly
import { COLLECTION_NAME, _fetchAndFormatUserById } from "./_common.js";

/**
 * Updates an existing user.
 */
export async function updateUser(id, updateData) {
  if (!pb) {
    throw new Error("PocketBase client is not initialized.");
  }
  if (!id || !updateData)
    throw new Error("User ID and update data are required.");
  console.log(`[Update] Updating ${id} in ${COLLECTION_NAME}...`);
  try {
    const pocketBaseUpdateData = updateData; //  Example:  { name: 'New Name', role: 'admin' }
    const updatedRawRecord = await pb
      .collection(COLLECTION_NAME)
      .update(id, pocketBaseUpdateData);
    // Fetch again with expansion for consistent formatted return
    const formattedUser = await _fetchAndFormatUserById(
      pb,
      updatedRawRecord.id
    ); // Pass pb instance
    return formattedUser;
  } catch (error) {
    console.error(
      `[Update] Error updating ${id} in ${COLLECTION_NAME}:`,
      error
    );
    if (error.status === 400 && error.data?.data) {
      console.warn("[Update] Validation Errors:", error.data.data);
    }
    return null;
  }
}
