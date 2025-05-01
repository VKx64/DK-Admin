"use client";
import { Icon } from "@iconify/react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import NewParts from "./NewParts"; // Import the NewParts component

const Header = ({ onRefresh }) => {
  // State to handle refresh button loading state
  const [isRefreshing, setIsRefreshing] = useState(false);
  // State to control the NewParts dialog visibility
  const [isNewPartDialogOpen, setIsNewPartDialogOpen] = useState(false);

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
            icon="mingcute:tool-line"
            className="text-4xl text-[#1E1E1E]"
          />
          <h1 className="font-raleway font-semibold text-2xl text-[#1E1E1E]">
            Parts Management
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row gap-3">
          {/* New Part Button */}
          <Button
            size={"lg"}
            className={"bg-blue-600 hover:bg-blue-700"}
            onClick={() => setIsNewPartDialogOpen(true)} // Open the dialog
          >
            <Plus className="h-5 w-5 mr-2" />
            New Part
          </Button>

          {/* Refresh Button */}
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

      {/* Render the NewParts Dialog */}
      <NewParts
        isOpen={isNewPartDialogOpen}
        onOpenChange={setIsNewPartDialogOpen}
        onPartCreated={onRefresh} // Pass the onRefresh function down
      />
    </>
  );
};

export default Header;