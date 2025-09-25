"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/react';

const Header = ({ onSearchChange, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Handle refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
    onRefresh?.();
    setIsRefreshing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Service History</h1>
          <p className="text-gray-600 mt-1">View completed service requests and their details</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative">
            <Icon
              icon="mingcute:search-line"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
            />
            <Input
              placeholder="Search completed services..."
              className="pl-10 w-72"
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <Icon
              icon="mingcute:refresh-2-line"
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Header;