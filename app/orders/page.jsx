"use client";
import Header from '@/components/v1/orders/Header';
import OrderList from '@/components/v1/orders/OrderList';
import { useState, useRef } from 'react';
import React from 'react';
import { useAuth } from '@/context/AuthContext';

const Page = () => {
  // State for managing search query across components
  const [searchQuery, setSearchQuery] = useState("");

  // Reference to the OrderList component for refreshing
  const orderListRef = useRef(null);

  // Get the current user from AuthContext
  const { user } = useAuth();

  // Handle search changes from the header
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle refresh from header
  const handleRefresh = () => {
    // Trigger refresh in the OrderList component
    if (orderListRef.current && orderListRef.current.handleRefresh) {
      orderListRef.current.handleRefresh();
    }
  };

  // Handle data changes from OrderList
  const handleDataChanged = () => {
    // Any logic needed when order data changes
    console.log("Order data has changed");
  };

  return (
    <div className='h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] gap-4 flex flex-col'>
      <Header
        onSearchChange={handleSearch}
        onRefresh={handleRefresh}
      />
      <OrderList
        ref={orderListRef}
        searchQuery={searchQuery}
        onDataChanged={handleDataChanged}
        user={user}
      />
    </div>
  );
};

export default Page;