import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, RefreshCcw, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Header = ({
  onSearchChange,
  onRefresh,
  onDateRangeChange,
  dateRange,
  onGenerateReport = () => {},
  onPrintReport = () => {},
  isGeneratingReport = false
}) => {
  const handleDateSelect = (selectedDate) => {
    if (!dateRange.from || (dateRange.from && dateRange.to)) {
      // Start new selection
      onDateRangeChange({ from: selectedDate, to: null });
    } else if (selectedDate < dateRange.from) {
      // Selected date is before the from date, so set it as the new from date
      onDateRangeChange({ from: selectedDate, to: null });
    } else {
      // Complete the range
      onDateRangeChange({ from: dateRange.from, to: selectedDate });
    }
  };

  const clearDateRange = () => {
    onDateRangeChange({ from: null, to: null });
  };

  const formatDateRange = () => {
    if (!dateRange.from) return "Select date range";
    if (!dateRange.to) return `${format(dateRange.from, "MMM dd, yyyy")} - Select end date`;
    return `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`;
  };

  return (
    <div className='w-full bg-white rounded-sm shadow-sm p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-2xl font-bold text-gray-800'>Order History</h1>
        <p className='text-sm text-gray-600'>View and manage completed orders with reporting capabilities</p>
      </div>

      <div className='flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto'>
        {/* Search Input */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search orders..."
            onChange={onSearchChange}
            className="bg-[#EFEFEF] rounded-sm font-raleway pl-10 w-full sm:w-64"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </div>
        </div>

        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-auto justify-start text-left font-normal bg-[#EFEFEF] border-gray-200",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex flex-col">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={handleDateSelect}
                initialFocus
                className="rounded-md border-0"
              />
              <div className="p-3 border-t flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateRange}
                  className="text-sm"
                >
                  Clear
                </Button>
                {dateRange.from && dateRange.to && (
                  <span className="text-xs text-muted-foreground">
                    Range selected
                  </span>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>

          <Button
            onClick={onGenerateReport}
            variant="default"
            size="sm"
            className="flex items-center gap-2"
            disabled={isGeneratingReport}
          >
            <Download className="h-4 w-4" />
            {isGeneratingReport ? 'Generating...' : 'Export'}
          </Button>

          <Button
            onClick={onPrintReport}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Header;