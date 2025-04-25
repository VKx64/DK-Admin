"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/v1/service/Header';
import DataTable from '@/components/v1/service/DataTable';
import { pb } from '@/lib/pocketbase';

const ServicePage = () => {
  // State for search query
  const [searchQuery, setSearchQuery] = useState("");

  // State to trigger refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle search change
  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  // Handle refresh triggered from header or elsewhere
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className='h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] gap-4 flex flex-col'>
      {/* Header with search functionality */}
      <Header
        onSearchChange={handleSearchChange}
        onRefresh={handleRefresh}
      />

      {/* DataTable component displays the service request data */}
      <DataTable
        searchQuery={searchQuery}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export default ServicePage;