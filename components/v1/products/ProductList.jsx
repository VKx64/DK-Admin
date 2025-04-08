"use client";
import React, { useState, useMemo } from 'react'
import Filters from './Filters'
import DataTable from './DataTable'
import { Button } from '@/components/ui/button'

const ProductList = () => {
  // ======= STATE MANAGEMENT =======
  // Product data with categories and discounts
  const [productData] = useState([
    {
      id: 1,
      name: "Air Conditioner Model X",
      stock: 25,
      price: 299.99,
      discount: 10,
      image: "/Images/default_user.jpg",
      category: "Air Conditioning"
    },
    {
      id: 2,
      name: "HVAC Filter Premium",
      stock: 120,
      price: 34.50,
      discount: 0,
      image: "/Images/default_user.jpg",
      category: "HVAC"
    },
    {
      id: 3,
      name: "Daikin Sensor Unit",
      stock: 45,
      price: 89.99,
      discount: 5,
      image: "/Images/default_user.jpg",
      category: "Control Systems"
    },
    {
      id: 4,
      name: "Temperature Controller",
      stock: 18,
      price: 149.95,
      discount: 15,
      image: "/Images/default_user.jpg",
      category: "Control Systems"
    },
    {
      id: 5,
      name: "Cooling Fan Assembly",
      stock: 37,
      price: 78.50,
      discount: 0,
      image: "/Images/default_user.jpg",
      category: "Ventilation"
    },
    {
      id: 6,
      name: "Compressor Unit",
      stock: 12,
      price: 425.00,
      discount: 20,
      image: "/Images/default_user.jpg",
      category: "HVAC"
    },
    {
      id: 7,
      name: "Remote Control Device",
      stock: 65,
      price: 29.99,
      discount: 0,
      image: "/Images/default_user.jpg",
      category: "Accessories"
    },
    {
      id: 8,
      name: "Installation Kit",
      stock: 42,
      price: 55.25,
      discount: 10,
      image: "/Images/default_user.jpg",
      category: "Accessories"
    },
    {
      id: 9,
      name: "Wall Mount Bracket",
      stock: 53,
      price: 19.95,
      discount: 0,
      image: "/Images/default_user.jpg",
      category: "Accessories"
    },
    {
      id: 10,
      name: "Maintenance Kit",
      stock: 31,
      price: 45.50,
      discount: 5,
      image: "/Images/default_user.jpg",
      category: "Accessories"
    },
    {
      id: 11,
      name: "Air Purifier Model S",
      stock: 29,
      price: 199.99,
      discount: 15,
      image: "/Images/default_user.jpg",
      category: "Air Conditioning"
    },
    {
      id: 12,
      name: "Humidifier Premium",
      stock: 47,
      price: 129.95,
      discount: 10,
      image: "/Images/default_user.jpg",
      category: "Air Conditioning"
    },
    {
      id: 13,
      name: "Smart Thermostat",
      stock: 82,
      price: 159.99,
      discount: 0,
      image: "/Images/default_user.jpg",
      category: "Control Systems"
    },
    {
      id: 14,
      name: "Heat Exchanger",
      stock: 15,
      price: 245.00,
      discount: 12,
      image: "/Images/default_user.jpg",
      category: "HVAC"
    },
    {
      id: 15,
      name: "Condenser Unit",
      stock: 24,
      price: 375.50,
      discount: 18,
      image: "/Images/default_user.jpg",
      category: "HVAC"
    },
    {
      id: 16,
      name: "Air Filter Pack",
      stock: 95,
      price: 22.49,
      discount: 0,
      image: "/Images/default_user.jpg",
      category: "Accessories"
    },
    {
      id: 17,
      name: "Refrigerant R-410A",
      stock: 38,
      price: 89.75,
      discount: 5,
      image: "/Images/default_user.jpg",
      category: "HVAC"
    },
    {
      id: 18,
      name: "Ventilation System",
      stock: 19,
      price: 269.99,
      discount: 10,
      image: "/Images/default_user.jpg",
      category: "Ventilation"
    },
    {
      id: 19,
      name: "Control Board Assembly",
      stock: 27,
      price: 124.50,
      discount: 0,
      image: "/Images/default_user.jpg",
      category: "Control Systems"
    },
    {
      id: 20,
      name: "WiFi Extension Module",
      stock: 51,
      price: 49.95,
      discount: 10,
      image: "/Images/default_user.jpg",
      category: "Accessories"
    }
  ])

  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState("")
  const [priceSort, setPriceSort] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")

  // State for table row selection
  const [rowSelection, setRowSelection] = useState({})

  // State for storing the table instance
  const [tableInstance, setTableInstance] = useState(null)

  // ======= DATA PROCESSING =======
  // Step 1: Filter data based on search query and category
  const filteredProducts = useMemo(() => {
    return productData.filter(product => {
      // Check if product name matches search query
      const nameMatches =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Check if product belongs to selected category
      const categoryMatches =
        selectedCategory === "" ||
        product.category === selectedCategory;

      // Product must match both conditions
      return nameMatches && categoryMatches;
    });
  }, [productData, searchQuery, selectedCategory]);

  // Step 2: Sort filtered data by price if needed
  const sortedProducts = useMemo(() => {
    // If no sorting is applied, just return filtered data
    if (!priceSort) return filteredProducts;

    // Create a copy to avoid mutating the original data
    return [...filteredProducts].sort((a, b) => {
      if (priceSort === 'lowToHigh') {
        return a.price - b.price; // Sort from lowest price to highest
      } else {
        return b.price - a.price; // Sort from highest price to lowest
      }
    });
  }, [filteredProducts, priceSort]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Store table instance from the DataTable component
  const handleTableReady = (table) => {
    setTableInstance(table);
  };

  // ======= RENDER UI =======
  return (
    <div className='w-full flex-1 bg-white rounded-sm shadow-sm p-4 flex flex-col gap-4 overflow-hidden'>
      {/* Filter component for search, sorting and filtering */}
      <Filters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onPriceSortChange={setPriceSort}
        onCategoryChange={setSelectedCategory}
      />

      {/* Divider line */}
      <div className='w-full h-[1px] bg-black/10' />

      {/* Use the DataTable component and get access to the table instance */}
      <DataTable
        data={sortedProducts}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        onTableReady={handleTableReady}
      />

      {/* Pagination Controls - Moved from DataTable to ProductList */}
      {tableInstance && (
        <div className="flex items-center justify-between">
          {/* Selection counter */}
          <div className="flex-1 text-sm text-muted-foreground font-raleway">
            {tableInstance.getFilteredSelectedRowModel().rows.length} of{" "}
            {tableInstance.getFilteredRowModel().rows.length} row(s) selected.
          </div>

          {/* Page navigation */}
          <div className="flex items-center space-x-6">

            {/* Page counter */}
            <span className="text-sm text-muted-foreground font-raleway">
              Page {tableInstance.getState().pagination.pageIndex + 1} of{" "}
              {tableInstance.getPageCount()}
            </span>

            {/* Pagination buttons */}
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => tableInstance.previousPage()}
                disabled={!tableInstance.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => tableInstance.nextPage()}
                disabled={!tableInstance.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductList