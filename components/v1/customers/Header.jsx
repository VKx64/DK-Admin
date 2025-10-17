"use client";
import { Icon } from "@iconify/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users } from "lucide-react";

const Header = ({ onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);

    if (onRefresh) {
      onRefresh();
    }

    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <div className="w-full bg-white shadow-sm p-4 rounded-sm flex flex-row justify-between">
      {/* Header Text and Icon */}
      <div className="flex flex-row gap-3 items-center w-fit">
        <Users className="text-3xl text-[#1E1E1E] w-8 h-8" />
        <h1 className="font-raleway font-semibold text-2xl text-[#1E1E1E]">
          Customer Management
        </h1>
      </div>

      {/* Refresh Button */}
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
      </div>
    </div>
  );
};

export default Header;
