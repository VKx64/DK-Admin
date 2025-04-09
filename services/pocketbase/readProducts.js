// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// 1. BASIC FUNCTION TO GET PRODUCTS
// This function gets a list of products with pagination
export async function getProducts(page = 1, perPage = 50) {
  try {
    // This line calls PocketBase to fetch products from the database
    return await pb.collection("products").getList(page, perPage);
  } catch (error) {
    // If something goes wrong, show the error and pass it along
    console.error("Error fetching products:", error);
    throw error;
  }
}

// 2. SIMPLE FUNCTION TO GET ONE PRODUCT BY ID
// This function gets a single product using its ID
export async function getProductById(id) {
  try {
    // This line calls PocketBase to fetch one specific product
    return await pb.collection("products").getOne(id);
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
}

// 3. FUNCTION TO GET PRODUCTS WITH ALL RELATED DATA
// This function gets products and includes their related information
// like pricing, specifications, stock, and warranty
export async function getProductsWithAllData(page = 1, perPage = 50, searchQuery = "") {
  try {
    // Create options object for filtering if needed
    const options = {};

    // Add search filter if provided
    if (searchQuery) {
      options.filter = `product_name ~ "${searchQuery}"`;
    }

    // This special "expand" option tells PocketBase to include related data
    // from other collections (tables) that are connected to products
    options.expand = "product_pricing_via_product_id,product_specifications_via_product_id,product_stocks_via_product_id,product_warranty_via_product_id";

    // Fetch products with expanded relations
    const result = await pb.collection("products").getList(page, perPage, options);

    // Make the data easier to work with by organizing it better
    const betterFormattedProducts = result.items.map(product => {
      // For each product, extract its related data from the expand object
      return {
        // Keep all original product data
        ...product,

        // Add easy access to related data (or null if not found)
        pricing: product.expand?.product_pricing_via_product_id?.[0] || null,
        specifications: product.expand?.product_specifications_via_product_id?.[0] || null,
        stock: product.expand?.product_stocks_via_product_id?.[0] || null,
        warranty: product.expand?.product_warranty_via_product_id?.[0] || null
      };
    });

    // Return the result with our better formatted products
    return {
      items: betterFormattedProducts,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page
    };
  } catch (error) {
    console.error("Error getting products with all data:", error);
    throw error;
  }
}

// 4. FUNCTION TO GET ONE PRODUCT WITH ALL RELATED DATA
// Similar to the function above, but for a single product
export async function getProductWithAllData(id) {
  try {
    // Fetch one product with all its related data
    const product = await pb.collection("products").getOne(id, {
      expand: "product_pricing_via_product_id,product_specifications_via_product_id,product_stocks_via_product_id,product_warranty_via_product_id"
    });

    // Format the product data to be easier to use
    return {
      ...product,
      pricing: product.expand?.product_pricing_via_product_id?.[0] || null,
      specifications: product.expand?.product_specifications_via_product_id?.[0] || null,
      stock: product.expand?.product_stocks_via_product_id?.[0] || null,
      warranty: product.expand?.product_warranty_via_product_id?.[0] || null
    };
  } catch (error) {
    console.error(`Error getting product ${id} with all data:`, error);
    throw error;
  }
}