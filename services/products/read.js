import { pb } from '../../lib/pocketbase.js';
import {
    COLLECTION_NAME,
    RELATED_FIELD_PRODUCT_ID,
    RELATED_FIELD_WARRANTY_PRODUCT,
    _formatReceivedProductData
} from './_common.js';

/**
 * Fetches a list of basic product data (ID, name, model, brand, image).
 * Does NOT fetch related pricing, specs, stock, etc. Use getProductDetailsById for that.
 * @param {number} [page=1] - The page number to retrieve.
 * @param {number} [perPage=20] - The number of records per page.
 * @param {object} [options={}] - PocketBase SDK options (filter, sort).
 * @returns {Promise<{ items: Array<object>, totalItems: number, totalPages: number, page: number }>}
 */
export async function getProducts(page = 1, perPage = 20, options = {}) {
    if (!pb) { throw new Error("PocketBase client is not initialized."); }
    try {
        // Ensure we only request fields needed for basic list + formatting image
        const fieldsOption = options.fields || 'id,product_name,product_model,brand,image,created,updated,collectionId,collectionName';
        const finalOptions = {
          ...options,
          fields: fieldsOption,
          requestKey: null  // prevent auto cancellation of the request
        };

        const rawResultList = await pb.collection(COLLECTION_NAME).getList(page, perPage, finalOptions);
        // Pass pb for image formatting, but null for related data as it wasn't fetched
        const formattedItems = rawResultList.items.map(item =>
            _formatReceivedProductData(item, null, null, null, null, pb)
        ).filter(Boolean);
        return { ...rawResultList, items: formattedItems };
    } catch (error) {
        console.error(`[Read:List] Error fetching ${COLLECTION_NAME}:`, error);
        throw error;
    }
}

/**
 * Fetches a single product by ID AND its related pricing, specs, stock, and warranty info.
 * Combines data into a single formatted object.
 * @param {string} id - Product ID.
 * @returns {Promise<object | null>} Formatted product object with all details, or null if not found.
 */
export async function getProductDetailsById(id) {
    if (!pb) { throw new Error("PocketBase client is not initialized."); }
    if (!id) throw new Error('Product ID is required.');

    try {
        // Use Promise.all to fetch main product and related data concurrently
        const results = await Promise.all([
            pb.collection(COLLECTION_NAME).getOne(id, { requestKey: null }), // Fetch main product
            pb.collection('product_pricing').getList(1, 1, {
              filter: `${RELATED_FIELD_PRODUCT_ID}='${id}'`,
              requestKey: null
            }),
            pb.collection('product_specifications').getList(1, 1, {
              filter: `${RELATED_FIELD_PRODUCT_ID}='${id}'`,
              requestKey: null
            }),
            pb.collection('product_stocks').getList(1, 1, {
              filter: `${RELATED_FIELD_PRODUCT_ID}='${id}'`,
              requestKey: null
            }),
            pb.collection('product_warranty').getList(1, 1, {
              filter: `${RELATED_FIELD_PRODUCT_ID}='${id}'`, // Updated to use correct field name
              requestKey: null
            })
        ]);

        const [rawProduct, pricingList, specsList, stockList, warrantyList] = results;

        // Extract first item from related lists (or null if empty)
        const pricingData = pricingList?.items?.[0] || null;
        const specsData = specsList?.items?.[0] || null;
        const stockData = stockList?.items?.[0] || null;
        const warrantyData = warrantyList?.items?.[0] || null;

        // Format and combine everything
        return _formatReceivedProductData(rawProduct, pricingData, specsData, stockData, warrantyData, pb);

    } catch (error) {
        // If the main product fetch failed with 404, return null
        if (error?.status === 404 && error?.response?.collectionName === COLLECTION_NAME) return null;
        console.error(`[Read:Details] Error fetching details for ${id}:`, error);
        throw error;
    }
}