// src/services/cart/_common.js
import { getPocketBaseInstance } from "../../lib/pocketbase.js"; // Adjust path if needed

// --- Configuration ---
export const COLLECTION_NAME = "user_cart"; // Still uses the actual DB collection name
export const EXPAND_PRODUCT_FIELD = "product";
export const EXPAND_USER_FIELD = "user";

// --- Default Values ---
const DEFAULT_QUANTITY = 0;
const DEFAULT_PRODUCT_NAME = "";
const DEFAULT_PRODUCT_MODEL = "";
const DEFAULT_PRODUCT_BRAND = "";

// --- Internal Formatting Helpers ---

/** Formats raw PocketBase cart item data into app format. */
export function _formatReceivedCartItem(rawItem, pbInstance) {
  // Needs pbInstance for file URLs
  if (!rawItem || !rawItem.id) return null;
  if (!pbInstance) {
    console.warn("_formatReceivedCartItem: pbInstance required for file URLs.");
  }

    const {
        id: cartItemId,
        quantity: rawQuantity = DEFAULT_QUANTITY,
        product: productId,
        user: userId,
    } = rawItem;

  const rawProduct = rawItem.expand?.[EXPAND_PRODUCT_FIELD];
  let formattedProduct = null;
  if (rawProduct) {
    let imageUrl = null;
    // Only generate URL if pbInstance is valid AND image exists
    if (pbInstance && rawProduct.image) {
      try {
        imageUrl = pbInstance.files.getUrl(rawProduct, rawProduct.image);
      } catch (_) {
        /* Ignore */
      }
    }
    formattedProduct = {
      productId: rawProduct.id,
      name: rawProduct.product_name || DEFAULT_PRODUCT_NAME,
      model: rawProduct.product_model || DEFAULT_PRODUCT_MODEL,
      brand: rawProduct.brand || DEFAULT_PRODUCT_BRAND,
      imageUrl: imageUrl,
      rawImageFilename: rawProduct.image || null,
      // Include complete raw product data for flexibility
      rawProductData: rawProduct
    };
  }

  const rawUser = rawItem.expand?.[EXPAND_USER_FIELD];
  const formattedUser = rawUser
    ? {
        userId: rawUser.id,
        name: rawUser.name || "",
        email: rawUser.email || "",
      }
    : null;

  return {
    cartItemId,
    quantity: rawQuantity,
    productDetails: formattedProduct,
    userDetails: formattedUser,
    productId,
    userId,
  };
}

/** Prepares app data for PocketBase 'user_cart' collection. */
export function _prepareDataForCartItem(appData) {
  if (
    !appData ||
    !appData.productId ||
    !appData.userId ||
    appData.quantity === undefined
  ) {
    throw new Error(
      "Missing required fields (productId, userId, quantity) for cart item."
    );
  }
  const pocketBaseData = {
    product: appData.productId,
    user: appData.userId,
    quantity: appData.quantity,
  };
  return pocketBaseData;
}

/** Fetches and formats a single cart item by ID internally. Requires pb instance. */
export async function _fetchAndFormatCartItemById(pbInstance, id) {
  if (!pbInstance) {
    throw new Error("PocketBase client is not initialized for internal fetch.");
  }
  if (!id) return null;
  try {
    // Ensure we get all fields from the product expansion
    const options = {
      expand: `${EXPAND_PRODUCT_FIELD},${EXPAND_USER_FIELD}`
    };
    const rawRecord = await pbInstance
      .collection(COLLECTION_NAME)
      .getOne(id, options);
    return _formatReceivedCartItem(rawRecord, pbInstance); // Pass pbInstance
  } catch (error) {
    if (error.status === 404) return null;
    console.error(`[_fetchAndFormatCartItemById] Error fetching ${id}:`, error);
    throw error;
  }
}
