"use client";
import { Icon } from "@iconify/react";
import React, { useState } from "react";
import SearchBar from "../SearchBar";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import OrderForm from "./OrderForm";

const Header = ({ onSearchChange, onOrderAdded, onRefresh }) => {
  // State to control the order form dialog
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
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
    <div>
      <div className="w-full bg-white shadow-sm p-4 rounded-sm flex flex-row justify-between">
        {/* Header Text and Icon */}
        <div className="flex flex-row gap-3 items-center w-fit">
          <Icon
            icon="material-symbols:order-approve-outline"
            className="text-3xl text-[#1E1E1E]"
          />
          <h1 className="font-raleway font-semibold text-2xl text-[#1E1E1E]">
            Order Management
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
            <RefreshCw
              className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            size={"lg"}
            className={"bg-[#5CCFBC]"}
            onClick={() => setIsOrderFormOpen(true)}
          >
            <Icon icon="mingcute:add-line" className="size-6" /> New Order
          </Button>
        </div>
      </div>

      {/* Order Form Dialog */}
      <OrderForm
        isOpen={isOrderFormOpen}
        onClose={() => setIsOrderFormOpen(false)}
        onSuccess={(newOrder) => {
          // Close the form
          setIsOrderFormOpen(false);

          // Pass the event up to refresh the order list
          if (onOrderAdded) {
            onOrderAdded(newOrder);
          }
        }}
      />
    </div>
  );
};

export default Header;