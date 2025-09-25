"use client";
import React, { useState, useMemo, useEffect } from 'react'
import Filters from './Filters'
import DataTable from './DataTable'
import { Button } from '@/components/ui/button'
import { getProductsWithAllData } from '@/services/pocketbase/readProducts'

const ProductList = ({ searchQuery = "", onDataChanged, onSearchChange, userRole }) => {
  // State for product data
  const [productData, setProductData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // State for pagination
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [totalPages, setTotalPages] = useState(0)

  // State for filtering and sorting
  const [priceSort, setPriceSort] = useState("")
  const [stockSort, setStockSort] = useState("")
  const [discountSort, setDiscountSort] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")

  // Extract unique categories from product data
  const uniqueCategories = useMemo(() => {
    const categories = new Set();
    productData.forEach(product => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    return Array.from(categories).sort();
  }, [productData]);

  // State for table row selection
  const [rowSelection, setRowSelection] = useState({})

  // State for storing the table instance
  const [tableInstance, setTableInstance] = useState(null)

  // Flag to force refresh data (after create/update/delete operations)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Fetch product data directly from the service
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Fetch products with their relations using our simplified function
        const result = await getProductsWithAllData(page, perPage, searchQuery);

        // Transform data for the table
        const transformedData = result.items.map(product => ({
          id: product.id,
          name: product.product_name,
          model: product.product_model,
          brand: product.brand,
          stock: product.stock?.stock_quantity || 0,
          price: product.pricing?.final_price || 0,
          basePrice: product.pricing?.base_price || 0,
          discount: product.pricing?.discount || 0,
          image: product.image ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${product.collectionId}/${product.id}/${product.image}` : "/Images/default_user.jpg",
          category: product.brand, // Using brand as category for now
          specifications: product.specifications || null,
          warranty: product.warranty || null,
        }));

        setProductData(transformedData);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [page, perPage, searchQuery, refreshTrigger]);

  // Client-side filtering based on category
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return productData;

    return productData.filter(product =>
      product.category === selectedCategory
    );
  }, [productData, selectedCategory]);

  // Client-side sorting based on price, stock, and discount
  const sortedProducts = useMemo(() => {
    let result = [...filteredProducts];

    // Apply price sorting
    if (priceSort) {
      result = result.sort((a, b) => {
        if (priceSort === 'lowToHigh') {
          return a.price - b.price;
        } else {
          return b.price - a.price;
        }
      });
    }

    // Apply stock sorting
    if (stockSort) {
      result = result.sort((a, b) => {
        if (stockSort === 'lowToHigh') {
          return a.stock - b.stock;
        } else {
          return b.stock - a.stock;
        }
      });
    }

    // Apply discount sorting
    if (discountSort) {
      result = result.sort((a, b) => {
        if (discountSort === 'lowToHigh') {
          return a.discount - b.discount;
        } else {
          return b.discount - a.discount;
        }
      });
    }

    return result;
  }, [filteredProducts, priceSort, stockSort, discountSort]);

  // Store table instance from the DataTable component
  const handleTableReady = (table) => {
    setTableInstance(table);
  };

  // Handle product data changes (create/update/delete)
  const handleDataChanged = () => {
    // Reset row selection
    setRowSelection({});
    // Force refresh by incrementing the trigger value
    setRefreshTrigger(prev => prev + 1);
    // Reset to first page when data changes
    setPage(1);

    // Notify parent component if callback provided
    if (onDataChanged) {
      onDataChanged();
    }
  };

  // Handle page navigation
  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  // RENDER UI
  return (
    <div className='w-full h-full flex flex-col gap-4'>
      <div className='w-full bg-white rounded-sm shadow-sm p-4 flex flex-col gap-4 flex-1 overflow-hidden'>
        {/* Filter component for search, sorting and filtering */}
        <Filters
          searchQuery={searchQuery}
          onSearchChange={(e) => {
            // Reset to first page when searching
            setPage(1);
            // Pass search change up to parent component
            if (onSearchChange) {
              onSearchChange(e);
            }
          }}
          onPriceSortChange={(value) => {
            setPriceSort(value);
            // Clear other sorts to avoid conflicts
            setStockSort("");
            setDiscountSort("");
            setPage(1); // Reset to first page when changing sort
          }}
          onStockSortChange={(value) => {
            setStockSort(value);
            // Clear other sorts to avoid conflicts
            setPriceSort("");
            setDiscountSort("");
            setPage(1); // Reset to first page when changing sort
          }}
          onDiscountSortChange={(value) => {
            setDiscountSort(value);
            // Clear other sorts to avoid conflicts
            setPriceSort("");
            setStockSort("");
            setPage(1); // Reset to first page when changing sort
          }}
          onCategoryChange={(value) => {
            setSelectedCategory(value);
            setPage(1); // Reset to first page when changing category
          }}
          uniqueCategories={uniqueCategories}
          userRole={userRole}
        />

        {/* Divider line */}
        <div className='w-full h-[1px] bg-black/10' />

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex justify-center items-center py-10 text-red-500">
            Error: {error}
          </div>
        )}

        {/* Use the DataTable component with CRUD functionality */}
        {!isLoading && !error && (
          <DataTable
            data={sortedProducts}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            onTableReady={handleTableReady}
            onDataChanged={handleDataChanged}
            userRole={userRole}
          />
        )}

        {/* Pagination Controls */}
        {!isLoading && !error && (
          <div className="flex items-center justify-between">
            {/* Selection counter */}
            <div className="flex-1 text-sm text-muted-foreground font-raleway">
              {tableInstance?.getFilteredSelectedRowModel().rows.length || 0} of{" "}
              {sortedProducts.length} row(s) selected.
            </div>

            {/* Page navigation */}
            <div className="flex items-center space-x-6">

              {/* Page counter */}
              <span className="text-sm text-muted-foreground font-raleway">
                Page {page} of {totalPages || 1}
              </span>

              {/* Pagination buttons */}
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductList