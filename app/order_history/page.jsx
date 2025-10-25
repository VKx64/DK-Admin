"use client";

import Header from "@/components/v1/order_history/Header";
import OrderHistoryList from "@/components/v1/order_history/OrderHistoryList";
import { useState, useRef } from "react";
import React from "react";
import { useAuth } from "@/context/AuthContext";

const Page = () => {
  // State for managing search query across components
  const [searchQuery, setSearchQuery] = useState("");

  // State for date range filtering
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null,
  });

  // Reference to the OrderHistoryList component for refreshing
  const orderHistoryListRef = useRef(null);

  // Get the current user from AuthContext
  const { user } = useAuth();

  // Handle search changes from the header
  const handleSearch = (e) => {
    setSearchQuery(e.target?.value ?? e); // supports input event or direct string
  };

  // Handle refresh from header
  const handleRefresh = () => {
    if (orderHistoryListRef.current?.handleRefresh) {
      orderHistoryListRef.current.handleRefresh();
    }
  };

  // Handle date range changes
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Handle report generation
  const handleGenerateReport = () => {
    if (orderHistoryListRef.current?.generateReport) {
      orderHistoryListRef.current.generateReport();
    }
  };

  // Handle print report
  const handlePrintReport = () => {
    if (orderHistoryListRef.current?.printReport) {
      orderHistoryListRef.current.printReport();
    }
  };

  // Handle data changes from OrderHistoryList
  const handleDataChanged = () => {
    // Any logic needed when order data changes
    console.log("Order history data has changed");
  };

  return (
    <div className="h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] gap-4 flex flex-col">
      <Header
        onSearchChange={handleSearch}
        onRefresh={handleRefresh}
        onDateRangeChange={handleDateRangeChange}
        dateRange={dateRange}
        onGenerateReport={handleGenerateReport}
        onPrintReport={handlePrintReport}
      />
      <OrderHistoryList
        ref={orderHistoryListRef}
        searchQuery={searchQuery}
        dateRange={dateRange}
        onDataChanged={handleDataChanged}
        user={user}
      />
    </div>
  );
};

export default Page;
