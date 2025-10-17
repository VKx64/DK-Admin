"use client";
import Header from '@/components/v1/customers/Header';
import CustomerList from '@/components/v1/customers/CustomerList';
import { useRef } from 'react';
import React from 'react';
import { useAuth } from '@/context/AuthContext';

const Page = () => {
  // Reference to the CustomerList component for refreshing
  const customerListRef = useRef(null);

  // Get the current user from AuthContext
  const { user } = useAuth();

  // Handle refresh from header
  const handleRefresh = () => {
    // Trigger refresh in the CustomerList component
    if (customerListRef.current && customerListRef.current.handleRefresh) {
      customerListRef.current.handleRefresh();
    }
  };

  return (
    <div className='h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] gap-4 flex flex-col'>
      <Header onRefresh={handleRefresh} />
      <CustomerList ref={customerListRef} user={user} />
    </div>
  );
};

export default Page;