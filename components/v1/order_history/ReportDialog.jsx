import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, FileText, Table as TableIcon } from 'lucide-react';
import { format } from 'date-fns';

const ReportDialog = ({
  open,
  onOpenChange,
  onGenerateReport,
  isGenerating,
  orderCount,
  dateRange
}) => {
  const [reportFormat, setReportFormat] = useState('csv');

  const handleGenerateReport = () => {
    const reportConfig = {
      format: reportFormat,
      includeDetails: true,
      includeCustomerInfo: true,
      includeDateRange: true
    };

    onGenerateReport(reportConfig);
  };

  const formatDateRange = () => {
    if (!dateRange.from && !dateRange.to) return "All completed orders";
    if (!dateRange.to) return `From ${format(new Date(dateRange.from), "MMM dd, yyyy")}`;
    return `${format(new Date(dateRange.from), "MMM dd, yyyy")} - ${format(new Date(dateRange.to), "MMM dd, yyyy")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Order History Report
          </DialogTitle>
          <DialogDescription>
            Export order history data for analysis and record keeping.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Orders to export:</span>
              <Badge variant="secondary">{orderCount} orders</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Date range:</span>
              <span className="text-sm font-medium">{formatDateRange()}</span>
            </div>
          </div>

          {/* Report Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReportFormat('csv')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  reportFormat === 'csv'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <TableIcon className="h-6 w-6" />
                  <span className="text-sm font-medium">CSV</span>
                  <span className="text-xs text-gray-500">Spreadsheet format</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReportFormat('json')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  reportFormat === 'json'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm font-medium">JSON</span>
                  <span className="text-xs text-gray-500">Raw data format</span>
                </div>
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Report will include:</label>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                Order ID, Customer Name, and Contact Information
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                Order Status and Completion Dates
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                Product Details and Total Amounts
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                Payment Methods and Delivery Information
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || orderCount === 0}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </>
              )}
            </Button>
          </div>

          {orderCount === 0 && (
            <div className="text-center text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
              No orders available to export with current filters
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;