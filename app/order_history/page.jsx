"use client";
import Header from '@/components/v1/order_history/Header';
import OrderHistoryList from '@/components/v1/order_history/OrderHistoryList';
import { useState, useRef } from 'react';
import React from 'react';
import { useAuth } from '@/context/AuthContext';

const Page = () => {
  // State for managing search query across components
  const [searchQuery, setSearchQuery] = useState("");

<<<<<<< HEAD
=======
  // State for date range filtering
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null
  });

>>>>>>> ce37edfb002a03c640fc0660a8685a852fc89176
  // Reference to the OrderHistoryList component for refreshing
  const orderHistoryListRef = useRef(null);

  // Get the current user from AuthContext
  const { user } = useAuth();

  // Handle search changes from the header
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle refresh from header
  const handleRefresh = () => {
    // Trigger refresh in the OrderHistoryList component
    if (orderHistoryListRef.current && orderHistoryListRef.current.handleRefresh) {
      orderHistoryListRef.current.handleRefresh();
    }
  };

<<<<<<< HEAD
=======
  // Handle date range changes
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Handle report generation
  const handleGenerateReport = () => {
    if (orderHistoryListRef.current && orderHistoryListRef.current.generateReport) {
      orderHistoryListRef.current.generateReport();
    }
  };

  // Handle print report
  const handlePrintReport = () => {
    if (orderHistoryListRef.current && orderHistoryListRef.current.printReport) {
      orderHistoryListRef.current.printReport();
    }
  };

>>>>>>> ce37edfb002a03c640fc0660a8685a852fc89176
  // Handle data changes from OrderHistoryList
  const handleDataChanged = () => {
    // Any logic needed when order data changes
    console.log("Order history data has changed");
  };

  return (
    <div className='h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] gap-4 flex flex-col'>
      <Header
        onSearchChange={handleSearch}
        onRefresh={handleRefresh}
<<<<<<< HEAD
=======
        onDateRangeChange={handleDateRangeChange}
        dateRange={dateRange}
        onGenerateReport={handleGenerateReport}
        onPrintReport={handlePrintReport}
>>>>>>> ce37edfb002a03c640fc0660a8685a852fc89176
      />
      <OrderHistoryList
        ref={orderHistoryListRef}
        searchQuery={searchQuery}
<<<<<<< HEAD
=======
        dateRange={dateRange}
>>>>>>> ce37edfb002a03c640fc0660a8685a852fc89176
        onDataChanged={handleDataChanged}
        user={user}
      />
    </div>
  );
};

<<<<<<< HEAD
export default Page;
=======
export default Page;
>>>>>>> ce37edfb002a03c640fc0660a8685a852fc89176
