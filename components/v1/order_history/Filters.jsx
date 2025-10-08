"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Calendar, X } from 'lucide-react';

const Filters = ({
  searchQuery,
  onSearchChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onPrintReport
}) => {

  const handleClearDates = () => {
    onStartDateChange(null);
    onEndDateChange(null);
  };

  const hasDateFilter = startDate || endDate;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-3 items-end justify-between">
        {/* Date Range Filters */}
        <div className="flex flex-row gap-3 items-end">
          <div className="flex flex-col gap-2">
            <Label htmlFor="startDate" className="text-sm font-raleway">
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate || ''}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-48"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="endDate" className="text-sm font-raleway">
              End Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate || ''}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-48"
              min={startDate || undefined}
            />
          </div>

          {hasDateFilter && (
            <Button
              variant="outline"
              size="default"
              onClick={handleClearDates}
              className="border-gray-300"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Dates
            </Button>
          )}
        </div>

        {/* Print Report Button */}
        <Button
          size="default"
          onClick={onPrintReport}
          className="bg-[#5CCFBC] hover:bg-[#4db8a6]"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Report
        </Button>
      </div>

      {/* Date Range Display */}
      {hasDateFilter && (
        <div className="text-sm text-muted-foreground font-raleway bg-blue-50 border border-blue-200 rounded p-2">
          <Calendar className="h-4 w-4 inline mr-2" />
          Showing orders from{' '}
          {startDate && endDate
            ? `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
            : startDate
              ? `${new Date(startDate).toLocaleDateString()} onwards`
              : `before ${new Date(endDate).toLocaleDateString()}`}
        </div>
      )}
    </div>
  );
};

export default Filters;
