import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input"
import { Filter, ChevronDown } from "lucide-react";

const Filters = ({
  searchQuery = "",
  onSearchChange,
  onStatusChange,
  selectedStatus = ""
}) => {
  // Completed order sub-statuses for more granular filtering
  const orderStatuses = [
    { label: "All Completed Orders", value: "" },
    { label: "Completed", value: "completed" },
  ];

  return (
    <div className="flex flex-row gap-4 items-center">
      {/* Search Input */}
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Search by Order ID, Customer, or Phone"
          value={searchQuery}
          onChange={onSearchChange}
          className="bg-[#EFEFEF] rounded-sm font-raleway pl-10"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
        </div>
      </div>

      {/* Status Filter (minimal for completed orders) */}
      <div className="text-sm bg-green-50 border border-green-200 rounded px-3 py-2">
        <span className="text-green-700 font-medium">
          ✅ Showing Completed Orders Only
        </span>
      </div>
    </div>
  );
};

export default Filters;