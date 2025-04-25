"use client";
import { Icon } from "@iconify/react";
import React, { useState } from "react";
import SearchBar from "../SearchBar";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const Header = ({ onSearchChange, onRefresh }) => {
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
            icon="carbon:customer-service"
            className="text-4xl text-[#1E1E1E]"
          />
          <h1 className="font-raleway font-semibold text-2xl text-[#1E1E1E]">
            Customer Service
          </h1>
        </div>

        {/* Search bar and Refresh Button */}
        <div className="flex flex-row gap-3">
          <SearchBar
            onChange={onSearchChange}
            placeholder="Search service requests..."
          />
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
        </div>
      </div>
    </>
  );
};

export default Header;