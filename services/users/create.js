// src/services/users/create.js
import { pb } from "../../lib/pocketbase.js"; // Import pb directly
import {
  COLLECTION_NAME,
  _prepareDataForPocketBase,
  _fetchAndFormatUserById, // Use the shared fetcher
} from "./_common.js";

/**
 * Creates a new user using application data format.
 */
export async function createUser(userInputData, options = {}) {
  if (!pb) {
    throw new Error("PocketBase client is not initialized.");
  }
  if (!userInputData) throw new Error("User input data is required.");

  console.log(`[Create] Creating in ${COLLECTION_NAME}...`);
  try {
    const pocketBaseData = _prepareDataForPocketBase(userInputData);
    const createdRawRecord = await pb
      .collection(COLLECTION_NAME)
      .create(pocketBaseData, options);
    // Fetch again with expansion for consistent formatted return
    const formattedUser = await _fetchAndFormatUserById(
      pb,
      createdRawRecord.id
    ); // Pass pb instance
    return formattedUser;
  } catch (error) {
    console.error(`[Create] Error creating in ${COLLECTION_NAME}:`, error);
    if (error.status === 400 && error.data?.data) {
      console.warn("[Create] Validation Errors:", error.data.data);
    }
    return null;
  }
}
