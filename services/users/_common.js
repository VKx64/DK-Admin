// src/services/users/_common.js
// Note: We don't import 'pb' here; each operation file will import it directly
// to make the null check explicit in each public-facing function.

// --- Configuration ---
export const COLLECTION_NAME = "_pb_users_auth_"; // Use the correct collection name
// No expand fields needed for users since the schema is flat.

// --- Internal Formatting Helpers ---

/** Formats raw PocketBase user data into app format. */
export function _formatReceivedUserData(rawUser) {
  if (!rawUser || !rawUser.id) return null;

  const {
    id: userId,
    email,
    name,
    avatar,
    role,
    verified,
    emailVisibility
  } = rawUser;

  return {
    userId,
    email,
    name,
    avatar,
    role,
    verified,
    emailVisibility
  };
}

/** Prepares app data for PocketBase '_pb_users_auth_' collection. */
export function _prepareDataForPocketBase(appData) {
  if (!appData) {
    throw new Error("Cannot prepare null/undefined data.");
  }

  const pocketBaseData = {
    email: appData.email,
    name: appData.name,
    avatar: appData.avatar,
    role: appData.role,
    verified: appData.verified,
    emailVisibility: appData.emailVisibility
  };

  return pocketBaseData;
}

/** Fetches and formats a single raw user by ID internally (used after create/update). Requires pb to be passed or imported. */
export async function _fetchAndFormatUserById(pbInstance, id) {
  if (!pbInstance) {
    throw new Error("PocketBase client is not initialized for internal fetch.");
  }
  if (!id) return null;
  try {
    const rawRecord = await pbInstance
      .collection(COLLECTION_NAME)
      .getOne(id);
    return _formatReceivedUserData(rawRecord);
  } catch (error) {
    if (error.status === 404) return null;
    console.error(`[_fetchAndFormatUserById] Error fetching ${id}:`, error);
    throw error;
  }
}
