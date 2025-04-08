export const COLLECTION_NAME = "delivery_information";

// Define default values for delivery information fields
const DEFAULT_NAME = "";
const DEFAULT_PHONE = "";
const DEFAULT_ADDRESS = "";
const DEFAULT_CITY = "";
const DEFAULT_ZIP_CODE = "";
const DEFAULT_ADDITIONAL_NOTES = "";
const DEFAULT_DELIVERY_FEE = null; // Changed to null to indicate it's optional

/**
 * Formats raw PocketBase delivery information data.
 * @param {object} rawData - Raw delivery information record from PocketBase.
 * @returns {object | null} Formatted delivery information object or null.
 */
export function _formatReceivedDeliveryData(rawData) {
    if (!rawData || !rawData.id) return null;

    const {
        id,
        name = DEFAULT_NAME,
        phone = DEFAULT_PHONE,
        address = DEFAULT_ADDRESS,
        city = DEFAULT_CITY,
        zip_code = DEFAULT_ZIP_CODE,
        additional_notes = DEFAULT_ADDITIONAL_NOTES,
        delivery_fee = DEFAULT_DELIVERY_FEE, // Optional field
        user = null,
        expand = {}
    } = rawData;

    // Handle expanded user data if available
    let userData = null;
    if (expand && expand.user) {
        userData = {
            id: expand.user.id,
            name: expand.user.name,
            email: expand.user.email,
            // Add other user fields as needed
        };
    }

    return {
        id,
        name,
        phone,
        address,
        city,
        zipCode: zip_code, // Consistent camelCase
        additionalNotes: additional_notes, // Consistent camelCase
        deliveryFee: delivery_fee, // Optional field with camelCase
        user: user, // The user ID reference
        userData: userData, // Expanded user data if available
    };
}

/**
 * Prepares app data for PocketBase 'delivery_information' collection.
 * @param {object} data - Delivery information data.
 * @returns {object} Prepared data for PocketBase.
 */
export function _prepareDataForDeliveryInfo(data) {
    if (!data) {
        throw new Error("Cannot prepare null/undefined delivery information data.");
    }

    const preparedData = {};

    if (data.name !== undefined) preparedData.name = data.name;
    if (data.phone !== undefined) preparedData.phone = data.phone;
    if (data.address !== undefined) preparedData.address = data.address;
    if (data.city !== undefined) preparedData.city = data.city;
    if (data.zip_code !== undefined || data.zipCode !== undefined) {
        preparedData.zip_code = data.zip_code ?? data.zipCode;
    }
    if (data.additional_notes !== undefined || data.additionalNotes !== undefined) {
        preparedData.additional_notes = data.additional_notes ?? data.additionalNotes;
    }
    // Only include delivery_fee if explicitly provided (since it's optional)
    if (data.delivery_fee !== undefined || data.deliveryFee !== undefined) {
        preparedData.delivery_fee = data.delivery_fee ?? data.deliveryFee;
    }

    // Handle user relation field
    if (data.user !== undefined) preparedData.user = data.user;

    return preparedData;
}
