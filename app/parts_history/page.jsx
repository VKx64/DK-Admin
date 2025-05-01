"use client";
import React, { useState, useEffect } from 'react';
import DataTable from '@/components/v1/parts_history/DataTable';
import Header from '@/components/v1/parts_history/Header';
import pb from '@/services/pocketbase';

const PartsHistoryPage = () => {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch parts history on initial load
  useEffect(() => {
    fetchHistory();
  }, []);

  // Fetch parts history data using PocketBase SDK
  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch history from part_stock_log, expand related records, sort by newest first
      const resultList = await pb.collection('part_stock_log').getFullList({
        expand: 'part,related_service',
        sort: '-created',
        requestKey: null, // Avoid caching if needed, or manage appropriately
      });

      setHistoryData(resultList);
    } catch (err) {
      console.error('Error fetching parts history:', err);
      let errorMessage = "An error occurred while fetching parts history.";
      if (err.message) {
        errorMessage += ` Details: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh (optional, if a refresh button is added to Header later)
  const handleRefresh = () => {
    fetchHistory();
  };

  return (
    <div className='h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] gap-4 flex flex-col'>
      {/* Pass handleRefresh if implementing refresh functionality in Header */}
      <Header onRefresh={handleRefresh} />

      {/* Error message display - simplified, DataTable handles its own error display */}
      {/* {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {error}. <button className="underline" onClick={fetchHistory}>Try again</button>
        </div>
      )} */}

      {/* Parts History Table */}
      <DataTable
        data={historyData}
        isLoading={isLoading}
        error={error} // Pass error to DataTable to handle display
      />
    </div>
  );
};

export default PartsHistoryPage;