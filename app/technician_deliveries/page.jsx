"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DeliveryList from '@/components/v1/technician_deliveries/DeliveryList';

const TechnicianDeliveriesPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if not a technician
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'technician')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className='h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] flex items-center justify-center'>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't render if not a technician
  if (!user || user.role !== 'technician') {
    return null;
  }

  return (
    <div className='h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] gap-4 flex flex-col'>
      <div className="bg-white rounded-sm shadow-sm p-4">
        <h1 className="text-2xl font-bold text-gray-800">My Deliveries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your assigned delivery orders
        </p>
      </div>

      <DeliveryList user={user} />
    </div>
  );
};

export default TechnicianDeliveriesPage;
