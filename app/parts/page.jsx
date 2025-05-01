"use client";
import React, { useState, useEffect } from 'react';
import DataTable from '@/components/v1/parts/DataTable';
import Header from '@/components/v1/parts/Header';
import pb from '@/services/pocketbase';

const PartsPage = () => {
  const [partsData, setPartsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch parts on initial load
  useEffect(() => {
    fetchParts();
  }, []);

  // Fetch parts data using PocketBase SDK
  const fetchParts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch parts from PocketBase
      const resultList = await pb.collection('parts').getFullList({
        requestKey: null,
      });

      setPartsData(resultList);
    } catch (err) {
      console.error('Error fetching parts:', err);
      setError("An error occurred while fetching parts");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchParts();
  };

  return (
    <div className='h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] gap-4 flex flex-col'>
      <Header onRefresh={handleRefresh} />

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {error}. <button className="underline" onClick={fetchParts}>Try again</button>
        </div>
      )}

      {/* Parts Table */}
      <DataTable
        data={partsData}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};

export default PartsPage;