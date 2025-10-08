"use client";
import Header from '@/components/v1/order_history/Header';
import OrderHistoryList from '@/components/v1/order_history/OrderHistoryList';
import { useState, useRef } from 'react';
import React from 'react';
import { useAuth } from '@/context/AuthContext';

const Page = () => {
  // State for managing search query across components
  const [searchQuery, setSearchQuery] = useState("");

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
      />
      <OrderHistoryList
        ref={orderHistoryListRef}
        searchQuery={searchQuery}
        onDataChanged={handleDataChanged}
        user={user}
      />
    </div>
  );
};

export default Page;
