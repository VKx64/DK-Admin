// src/services/orders/_common.js
// Note: We don't import 'pb' here; each operation file will import it directly
// to make the null check explicit in each public-facing function.

// --- Configuration ---
export const COLLECTION_NAME = "user_order";
export const EXPAND_PRODUCTS_FIELD = "products";
export const EXPAND_ADDRESS_FIELD = "address";

// --- Default Values ---
const DEFAULT_ORDER_STATUS = "Pending"; // Updated default to match typical initial state
const DEFAULT_PAYMENT_METHOD = "Unknown";

// --- Internal Formatting Helpers ---

/** Formats raw PocketBase order data into app format. */
export function _formatReceivedOrderData(rawOrder) {
  if (!rawOrder || !rawOrder.id) return null;

  const {
    id: orderId,
    status: rawStatus = DEFAULT_ORDER_STATUS,
    created: rawCreated,
    updated: rawUpdated,
    mode_of_payment: paymentMethod = DEFAULT_PAYMENT_METHOD,
    products: productIds = [],
    address: addressId = null,
    total_price: totalPrice = 0, // Added total_price field
    user: userId = null,  // Added user field
  } = rawOrder;

  const deliveryInfo = rawOrder.expand?.[EXPAND_ADDRESS_FIELD];
  const formattedAddress = deliveryInfo
    ? {
        id: deliveryInfo.id,
        recipientName: deliveryInfo.name || "",
        phone: deliveryInfo.phone || "",
        addressLine: deliveryInfo.address || "",
        city: deliveryInfo.city || "",
        zipCode: deliveryInfo.zip_code || "",
        notes: deliveryInfo.additional_notes || "",
      }
    : null;

  const rawProducts = rawOrder.expand?.[EXPAND_PRODUCTS_FIELD];
  const formattedProducts = Array.isArray(rawProducts)
    ? rawProducts.map((p) => ({
        productId: p.id,
        name: p.product_name || "N/A",
        model: p.product_model || "N/A",
        brand: p.brand || "",
        imageUrl: p.expand?.imageUrl || null,
        price: p.expand?.pricing?.final_price || 0,
      }))
    : [];

  return {
    orderId,
    status: rawStatus,
    orderDate: rawCreated ? new Date(rawCreated) : null,
    updatedDate: rawUpdated ? new Date(rawUpdated) : null,
    paymentMethod,
    totalPrice,
    userId,
    shippingAddress: formattedAddress,
    orderedProducts: formattedProducts,
    productIds,
    addressId,
  };
}

/** Prepares app data for PocketBase 'user_order' collection. */
export function _prepareDataForPocketBase(appData) {
  // console.log('[Prepare] Input app data:', appData); // Keep logs minimal if preferred
  if (!appData) {
    throw new Error("Cannot prepare null/undefined data.");
  }
  const pocketBaseData = {
    products: appData.productIds,
    mode_of_payment: appData.paymentType,
    address: appData.deliveryInfoId,
    status: appData.status || DEFAULT_ORDER_STATUS,
    total_price: appData.totalPrice || 0,
    user: appData.userId,
  };
  // console.log('[Prepare] Output PB data:', pocketBaseData);
  return pocketBaseData;
}

/** Fetches and formats a single raw order by ID internally (used after create/update). Requires pb to be passed or imported. */
export async function _fetchAndFormatOrderById(pbInstance, id) {
  if (!pbInstance) {
    throw new Error("PocketBase client is not initialized for internal fetch.");
  }
  if (!id) return null;
  try {
    const options = {
      expand: `${EXPAND_PRODUCTS_FIELD},${EXPAND_ADDRESS_FIELD}`,
      requestKey: null // prevent auto cancellation of the request
    };
    const rawRecord = await pbInstance
      .collection(COLLECTION_NAME)
      .getOne(id, options);
    return _formatReceivedOrderData(rawRecord);
  } catch (error) {
    if (error.status === 404) return null;
    console.error(`[_fetchAndFormatOrderById] Error fetching ${id}:`, error);
    throw error;
  }
}
