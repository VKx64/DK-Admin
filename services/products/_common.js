// src/services/products/_common.js
// NOTE: Does NOT import 'pb' here. Operation files import it directly.

// --- Configuration ---
export const COLLECTION_NAME = 'products';

// Field names in related collections used for filtering/fetching
export const RELATED_FIELD_PRODUCT_ID = 'product_id'; // Used in pricing, specs, stock
export const RELATED_FIELD_WARRANTY_PRODUCT = 'product_id'; // Used in warranty - fixed to match schema

// --- Default Values ---
const DEFAULT_PRODUCT_NAME = '';
const DEFAULT_PRODUCT_MODEL = '';
const DEFAULT_PRODUCT_BRAND = '';

// --- Internal Formatting Helpers ---

/**
 * Formats raw PocketBase product data and merges related info into app format.
 * @param {object} rawProduct - Raw product record from PocketBase.
 * @param {object|null} pricingData - Raw pricing record (or null).
 * @param {object|null} specsData - Raw specifications record (or null).
 * @param {object|null} stockData - Raw stock record (or null).
 * @param {object|null} warrantyData - Raw warranty record (or null).
 * @param {import('pocketbase').default | null} pbInstance - PocketBase instance needed for file URLs.
 * @returns {object | null} Formatted product object or null.
 */
export function _formatReceivedProductData(rawProduct, pricingData, specsData, stockData, warrantyData, pbInstance) {
    if (!rawProduct || !rawProduct.id) return null;
    if (!pbInstance) { console.warn("_formatReceivedProductData: pbInstance required for file URLs."); }

    const {
        id: productId,
        product_name: name = DEFAULT_PRODUCT_NAME,
        product_model: model = DEFAULT_PRODUCT_MODEL,
        brand = DEFAULT_PRODUCT_BRAND,
        image: rawImageFilename,
    } = rawProduct;

    let imageUrl = null;
    if (pbInstance && rawProduct.image) {
        try { imageUrl = pbInstance.files.getUrl(rawProduct, rawProduct.image); } catch (e) { /* Ignore */ }
    }

    // Format related data if present
    const formattedPricing = pricingData ? {
        basePrice: pricingData.base_price ?? null,
        discount: pricingData.discount ?? null,
        finalPrice: pricingData.final_price ?? null,
    } : null;

    const formattedSpecs = specsData ? {
        hpCapacity: specsData.hp_capacity || null,
        refrigerant: specsData.refrigerant || null,
        compressorType: specsData.compressorType || null,
    } : null;

    const formattedStock = stockData ? {
        quantity: stockData.stock_quantity ?? 0,
    } : null;

    const formattedWarranty = warrantyData ? {
        coverage: warrantyData.coverage || null,
        duration: warrantyData.duration || null,
    } : null;

    // Combine into final application object
    return {
        productId,
        name,
        model,
        brand,
        imageUrl,
        rawImageFilename,
        // Add nested formatted related data
        pricing: formattedPricing,
        specifications: formattedSpecs,
        stock: formattedStock,
        warranty: formattedWarranty,
    };
}

/** Prepares app data for PocketBase 'products' collection (handles FormData for files). */
export function _prepareDataForProduct(appData) {
    if (!appData) { throw new Error("Cannot prepare null/undefined product data."); }
    const hasFile = appData.imageFile instanceof File;
    const CUDData = hasFile ? new FormData() : {};

    if (appData.name !== undefined) CUDData[hasFile ? 'append' : 'product_name']('product_name', appData.name);
    if (appData.model !== undefined) CUDData[hasFile ? 'append' : 'product_model']('product_model', appData.model);
    if (appData.brand !== undefined) CUDData[hasFile ? 'append' : 'brand']('brand', appData.brand);

    if (hasFile) { CUDData.append('image', appData.imageFile); }
    else if (appData.imageFile === null) { CUDData.image = null; } // Explicitly remove

    // console.log('[Prepare Product] Data prepared for PocketBase:', hasFile ? 'FormData keys' : CUDData);
    return CUDData;
}