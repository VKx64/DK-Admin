"use client";
import { Icon } from "@iconify/react";
import React, { useState } from "react";
import SearchBar from "../SearchBar";
import { Button } from "@/components/ui/button";
import ProductForm from "./ProductForm";
import { RefreshCw } from "lucide-react"; // Import the Lucide React refresh icon
import { canManageProducts } from "@/utils/roleUtils";

const Header = ({ onSearchChange, onProductAdded, onRefresh, userRole }) => {
  // State to control the product form dialog
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  // State to handle refresh button loading state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);

    // Call the refresh function passed from parent
    if (onRefresh) {
      onRefresh();
    }

    // Reset the loading state after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <>
      <div className="w-full bg-white shadow-sm p-4 rounded-sm flex flex-row justify-between">
        {/* Header Text and Icon */}
        <div className="flex flex-row gap-3 items-center w-fit">
          <Icon
            icon="mingcute:air-condition-open-line"
            className="text-4xl text-[#1E1E1E]"
          />
          <h1 className="font-raleway font-semibold text-2xl text-[#1E1E1E]">
            Product Management
          </h1>
        </div>

        {/* Search bar and Buttons */}
        <div className="flex flex-row gap-3">
          <Button
            size={"lg"}
            variant={"outline"}
            className={"border-gray-300"}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {/* Use the Lucide React component directly instead of Icon component */}
            <RefreshCw
              className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          {canManageProducts(userRole) && (
            <Button
              size={"lg"}
              className={"bg-[#5CCFBC]"}
              onClick={() => setIsProductFormOpen(true)}
            >
              <Icon icon="mingcute:add-line" className="size-6" /> Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Product Form Dialog */}
      <ProductForm
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        onSuccess={(newProduct) => {
          // Close the form
          setIsProductFormOpen(false);

          // Pass the event up to refresh the product list
          if (onProductAdded) {
            onProductAdded(newProduct);
          }
        }}
        userRole={userRole}
      />
    </>
  );
};

export default Header;
