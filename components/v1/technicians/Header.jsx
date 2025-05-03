"use client";
import { Icon } from "@iconify/react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserPlus } from "lucide-react";
import NewTechnician from "./NewTechnician";

const Header = ({ onRefresh }) => {
  // State to handle refresh button loading state
  const [isRefreshing, setIsRefreshing] = useState(false);
  // State to control the NewTechnician dialog
  const [isNewTechnicianOpen, setIsNewTechnicianOpen] = useState(false);

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
            icon="mdi:worker"
            className="text-4xl text-[#1E1E1E]"
          />
          <h1 className="font-raleway font-semibold text-2xl text-[#1E1E1E]">
            Technician Management
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row gap-3">
          <Button
            size={"lg"}
            variant={"default"}
            className={"bg-primary hover:bg-primary/90"}
            onClick={() => setIsNewTechnicianOpen(true)}
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Register Technician
          </Button>

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

      {/* NewTechnician Dialog */}
      <NewTechnician
        open={isNewTechnicianOpen}
        onOpenChange={setIsNewTechnicianOpen}
        onSuccess={handleRefresh} // Refresh the list when a new technician is added
      />
    </>
  );
};

export default Header;