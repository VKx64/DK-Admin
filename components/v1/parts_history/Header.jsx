"use client";
import { Icon } from "@iconify/react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const Header = ({ onRefresh }) => {
  // State to handle refresh button loading state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);

    // Call the refresh function passed from parent
    if (onRefresh) {
      onRefresh();
    }

    // Reset the loading state after a short delay to give feedback
    // Adjust delay as needed, or remove if parent handles loading state feedback
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <div className="w-full bg-white shadow-sm p-4 rounded-sm flex flex-row justify-between items-center">
      {/* Header Text and Icon */}
      <div className="flex flex-row gap-3 items-center w-fit">
        <Icon
          icon="material-symbols:history" // Using a history icon
          className="text-4xl text-[#1E1E1E]"
        />
        <h1 className="font-raleway font-semibold text-2xl text-[#1E1E1E]">
          Parts Usage History
        </h1>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-row gap-3">
        {/* Refresh Button */}
        <Button
          size={"lg"}
          variant={"outline"}
          className={"border-gray-300"}
          onClick={handleRefresh}
          disabled={isRefreshing || !onRefresh} // Disable if refreshing or no handler provided
        >
          <RefreshCw
            className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
    </div>
  );
};

export default Header;
