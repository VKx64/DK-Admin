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
  // Order status options based on the PocketBase schema
  const orderStatuses = [
    { label: "All Orders", value: "" },
    { label: "Pending", value: "Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Declined", value: "Declined" }
  ];

  return (
    <div className="flex flex-row gap-4 items-center">
      {/* Search Input */}
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Search by Order ID or Customer"
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

      {/* Order Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 bg-[#EFEFEF] rounded-sm px-3 py-2 border border-gray-200 hover:bg-gray-100 transition-colors">
          <Filter className="h-4 w-4" />
          <span className="font-medium text-sm text-gray-700">
            {selectedStatus ?
              orderStatuses.find(s => s.value === selectedStatus)?.label :
              "Order Status"}
          </span>
          <ChevronDown className="h-4 w-4 ml-1" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {orderStatuses.map((status) => (
            <DropdownMenuItem
              key={status.value}
              onClick={() => onStatusChange(status.value)}
              className={selectedStatus === status.value ? "bg-gray-100 font-medium" : ""}
            >
              {status.label}
              {selectedStatus === status.value && (
                <svg className="ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Filters;