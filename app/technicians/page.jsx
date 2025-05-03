"use client";
import Header from '@/components/v1/technicians/Header';
import { useState, useEffect, useRef } from 'react';
import React from 'react';
import TechnicianTable from '@/components/v1/technicians/TechnicianTable';
import pb from '@/services/pocketbase';

const Page = () => {
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch technicians on initial load
  useEffect(() => {
    fetchTechnicians();
  }, []);

  // Fetch technicians data using PocketBase SDK
  const fetchTechnicians = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch users with technician role and expand the technician_details relation
      const resultList = await pb.collection('users').getList(1, 100, {
        filter: 'role = "technician"',
        expand: 'technician_details',
        requestKey: null,
      });

      setTechnicians(resultList.items);
    } catch (err) {
      setError("An error occurred while fetching technicians");
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh from header
  const handleRefresh = () => {
    fetchTechnicians();
  };

  return (
    <div className='h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] gap-4 flex flex-col'>
      <Header onRefresh={handleRefresh} />

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {error}. <button className="underline" onClick={fetchTechnicians}>Try again</button>
        </div>
      )}

      <TechnicianTable
        technicians={technicians}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Page;