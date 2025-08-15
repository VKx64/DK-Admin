import pb from "../pocketbase";

/**
 * Create a new branch detail record
 * @param {Object} data - Branch details data
 * @returns {Promise} - Created branch detail record
 */
export const createBranchDetails = async (data) => {
  try {
    const formData = new FormData();

    // Required fields
    formData.append("branch_name", data.branch_name);
    formData.append("manager_name", data.manager_name);
    formData.append("branch_email", data.branch_email);
    formData.append("user_id", data.user_id);

    // Optional fields
    if (data.branch_latitude) {
      const lat = parseFloat(data.branch_latitude);
      if (!isNaN(lat)) formData.append("branch_latitude", lat);
    }

    if (data.branch_longitude) {
      const lng = parseFloat(data.branch_longitude);
      if (!isNaN(lng)) formData.append("branch_longitude", lng);
    }

    // Handle file upload
    if (data.branch_image && data.branch_image instanceof File) {
      formData.append("branch_image", data.branch_image);
    }

    return await pb.collection("branch_details").create(formData, {
      requestKey: null
    });
  } catch (error) {
    console.error("Error creating branch details:", error);
    throw error;
  }
};

/**
 * Update an existing branch detail record
 * @param {string} id - Record ID
 * @param {Object} data - Updated branch details data
 * @returns {Promise} - Updated branch detail record
 */
export const updateBranchDetails = async (id, data) => {
  try {
    const formData = new FormData();

    // Required fields
    if (data.branch_name) formData.append("branch_name", data.branch_name);
    if (data.manager_name) formData.append("manager_name", data.manager_name);
    if (data.branch_email) formData.append("branch_email", data.branch_email);

    // Super admin can update user_id
    if (data.user_id) formData.append("user_id", data.user_id);

    // Optional fields
    if (data.branch_latitude) {
      const lat = parseFloat(data.branch_latitude);
      if (!isNaN(lat)) formData.append("branch_latitude", lat);
    }

    if (data.branch_longitude) {
      const lng = parseFloat(data.branch_longitude);
      if (!isNaN(lng)) formData.append("branch_longitude", lng);
    }

    // Handle file upload
    if (data.branch_image && data.branch_image instanceof File) {
      formData.append("branch_image", data.branch_image);
    }

    return await pb.collection("branch_details").update(id, formData, {
      requestKey: null
    });
  } catch (error) {
    console.error("Error updating branch details:", error);
    throw error;
  }
};

/**
 * Delete a branch detail record
 * @param {string} id - Record ID
 * @returns {Promise} - Deletion result
 */
export const deleteBranchDetails = async (id) => {
  try {
    return await pb.collection("branch_details").delete(id, {
      requestKey: null
    });
  } catch (error) {
    console.error("Error deleting branch details:", error);
    throw error;
  }
};

/**
 * Get branch details by user ID
 * @param {string} userId - User ID
 * @returns {Promise} - Array of branch detail records
 */
export const getBranchDetailsByUserId = async (userId) => {
  try {
    return await pb.collection("branch_details").getFullList({
      filter: `user_id="${userId}"`,
      sort: "-created",
      requestKey: null
    });
  } catch (error) {
    console.error("Error fetching branch details by user ID:", error);
    throw error;
  }
};

/**
 * Get all branch details (super admin only)
 * @returns {Promise} - Array of all branch detail records
 */
export const getAllBranchDetails = async () => {
  try {
    return await pb.collection("branch_details").getFullList({
      sort: "-created",
      requestKey: null
    });
  } catch (error) {
    console.error("Error fetching all branch details:", error);
    throw error;
  }
};

/**
 * Get a single branch detail record by ID
 * @param {string} id - Record ID
 * @returns {Promise} - Branch detail record
 */
export const getBranchDetailsById = async (id) => {
  try {
    return await pb.collection("branch_details").getOne(id, {
      requestKey: null
    });
  } catch (error) {
    console.error("Error fetching branch details by ID:", error);
    throw error;
  }
};

/**
 * Check if user has permission to access branch details
 * @param {Object} user - Current user object
 * @param {string} targetUserId - Target user ID (optional, for specific record access)
 * @returns {Object} - Permission object with canRead, canCreate, canEdit, canDelete
 */
export const checkBranchDetailsPermissions = (user, targetUserId = null) => {
  const isSuperAdmin = user?.role === "super-admin";
  const isAdmin = user?.role === "admin";
  const isOwner = targetUserId ? user?.id === targetUserId : true;

  return {
    canRead: isSuperAdmin || (isAdmin && isOwner),
    canCreate: isSuperAdmin || isAdmin,
    canEdit: isSuperAdmin || (isAdmin && isOwner),
    canDelete: isSuperAdmin,
    canViewAll: isSuperAdmin,
  };
};
