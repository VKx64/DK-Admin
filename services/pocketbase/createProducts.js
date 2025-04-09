// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// 1. FUNCTION TO CREATE A NEW PRODUCT WITH BASIC INFO
// This creates just the main product record
export async function createBasicProduct(productData) {
  try {
    // Create the product record with basic information
    const newProduct = await pb.collection("products").create(productData);

    return {
      success: true,
      message: "Product created successfully",
      product: newProduct
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      message: error.message || "Failed to create product",
      error
    };
  }
}

// 2. FUNCTION TO CREATE A COMPLETE PRODUCT WITH ALL RELATED DATA
// This creates the product with all its related data (pricing, specs, stock, warranty)
export async function createProductWithAllData(productData, relatedData = {}) {
  try {
    // 1. First create the base product
    const newProduct = await pb.collection("products").create(productData);
    const productId = newProduct.id;

    // Keep track of created related records
    const createdRecords = {
      product: newProduct
    };

    // 2. Create related records if provided

    // Create pricing record if data is provided
    if (relatedData.pricing) {
      try {
        // Add the product_id field to connect it to the main product
        const pricingData = {
          ...relatedData.pricing,
          product_id: productId
        };

        const pricing = await pb.collection("product_pricing").create(pricingData);
        createdRecords.pricing = pricing;
      } catch (err) {
        console.error("Error creating pricing data:", err);
        // Continue with other creations even if this one fails
      }
    }

    // Create specifications record if data is provided
    if (relatedData.specifications) {
      try {
        const specsData = {
          ...relatedData.specifications,
          product_id: productId
        };

        const specs = await pb.collection("product_specifications").create(specsData);
        createdRecords.specifications = specs;
      } catch (err) {
        console.error("Error creating specifications data:", err);
      }
    }

    // Create stock record if data is provided
    if (relatedData.stock) {
      try {
        const stockData = {
          ...relatedData.stock,
          product_id: productId
        };

        const stock = await pb.collection("product_stocks").create(stockData);
        createdRecords.stock = stock;
      } catch (err) {
        console.error("Error creating stock data:", err);
      }
    }

    // Create warranty record if data is provided
    if (relatedData.warranty) {
      try {
        const warrantyData = {
          ...relatedData.warranty,
          product_id: productId
        };

        const warranty = await pb.collection("product_warranty").create(warrantyData);
        createdRecords.warranty = warranty;
      } catch (err) {
        console.error("Error creating warranty data:", err);
      }
    }

    // Return the created product and its related records
    return {
      success: true,
      message: "Product with related data created successfully",
      data: createdRecords
    };
  } catch (error) {
    console.error("Error creating product with related data:", error);
    return {
      success: false,
      message: error.message || "Failed to create product",
      error
    };
  }
}

// 3. FUNCTION TO ADD A SINGLE RELATED RECORD TO AN EXISTING PRODUCT
// Useful for adding just pricing, specifications, stock, or warranty to an existing product
export async function addProductRelatedData(productId, dataType, data) {
  try {
    // Determine which collection to add to based on dataType
    let collectionName;
    switch (dataType.toLowerCase()) {
      case 'pricing':
        collectionName = "product_pricing";
        break;
      case 'specifications':
        collectionName = "product_specifications";
        break;
      case 'stock':
        collectionName = "product_stocks";
        break;
      case 'warranty':
        collectionName = "product_warranty";
        break;
      default:
        return {
          success: false,
          message: `Unknown data type: ${dataType}`
        };
    }

    // Check if a record already exists
    try {
      await pb.collection(collectionName).getFirstListItem(`product_id="${productId}"`);
      // If we reach here, a record exists, so we return false
      return {
        success: false,
        message: `A ${dataType} record already exists for this product. Use update instead.`
      };
    } catch (err) {
      // No record found, so we can create a new one - this is expected
    }

    // Add the product_id to connect it to the main product
    const recordData = {
      ...data,
      product_id: productId
    };

    // Create the record
    const newRecord = await pb.collection(collectionName).create(recordData);

    return {
      success: true,
      message: `${dataType} data added successfully`,
      data: newRecord
    };
  } catch (error) {
    console.error(`Error adding ${dataType} data to product ${productId}:`, error);
    return {
      success: false,
      message: error.message || `Failed to add ${dataType} data`,
      error
    };
  }
}