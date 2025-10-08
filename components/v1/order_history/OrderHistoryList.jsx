"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Filters from './Filters';
import DataTable from './DataTable';
import OrderDetailsDialog from '../orders/OrderDetailsDialog';
import ReportDialog from './ReportDialog';
import { Button } from '@/components/ui/button';
import { getOrdersByRole } from '@/services/pocketbase/readOrders';

const OrderHistoryList = forwardRef(({
  searchQuery = "",
  dateRange,
  onDataChanged,
  user
}, ref) => {
  // State for order data
  const [orderData, setOrderData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for pagination
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [filteredData, setFilteredData] = useState([]);

  // State for filtering
  const [selectedStatus, setSelectedStatus] = useState("");

  // State for table row selection
  const [rowSelection, setRowSelection] = useState({});
  const [tableInstance, setTableInstance] = useState(null);

  // State for viewing order details
  const [viewingOrder, setViewingOrder] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // State for report generation
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Expose handleRefresh function to parent component through ref
  useImperativeHandle(ref, () => ({
    handleRefresh: () => {
      setRefreshTrigger(prev => prev + 1);
    },
    generateReport: () => {
      setIsReportDialogOpen(true);
    },
    printReport: () => {
      handlePrintReport();
    }
  }));

  // Fetch completed orders only
  useEffect(() => {
    const fetchCompletedOrders = async () => {
      setIsLoading(true);
      try {
        // Always use role-based filtering - if no user, return empty array
        if (!user) {
          console.warn("No authenticated user found, cannot fetch order history");
          setOrderData([]);
          return;
        }

        const allOrders = await getOrdersByRole(user);

        // Filter to only show completed orders
        const completedOrders = allOrders.filter(order => order.status === 'completed');
        setOrderData(completedOrders);

        // Apply filters and pagination
        applyFiltersAndPagination(completedOrders, searchQuery, selectedStatus, dateRange, page, perPage);
      } catch (err) {
        console.error('Error fetching order history:', err);
        setError(err?.message || 'Failed to fetch order history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletedOrders();
  }, [refreshTrigger, user]);

  // Apply filters and pagination when dependencies change
  useEffect(() => {
    if (orderData.length > 0) {
      applyFiltersAndPagination(orderData, searchQuery, selectedStatus, dateRange, page, perPage);
    }
  }, [searchQuery, selectedStatus, dateRange, page, perPage, orderData]);

  // Function to apply filters and pagination client-side
  const applyFiltersAndPagination = (data, search, status, dateFilter, currentPage, itemsPerPage) => {
    // Apply search filter if provided
    let filtered = data;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchLower) ||
        (order.expand?.user?.name && order.expand.user.name.toLowerCase().includes(searchLower)) ||
        (order.guest_user && order.guest_user.toLowerCase().includes(searchLower)) ||
        (order.expand?.address?.name && order.expand.address.name.toLowerCase().includes(searchLower)) ||
        (order.expand?.address?.phone && order.expand.address.phone.includes(search))
      );
    }

    // Apply status filter if provided
    if (status) {
      filtered = filtered.filter(order => order.status === status);
    }

    // Apply date range filter if provided
    if (dateFilter.from || dateFilter.to) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.delivery_completed_date || order.created);
        const fromDate = dateFilter.from ? new Date(dateFilter.from) : null;
        const toDate = dateFilter.to ? new Date(dateFilter.to) : null;

        if (fromDate && toDate) {
          return orderDate >= fromDate && orderDate <= toDate;
        } else if (fromDate) {
          return orderDate >= fromDate;
        } else if (toDate) {
          return orderDate <= toDate;
        }
        return true;
      });
    }

    // Calculate total pages
    const totalFilteredItems = filtered.length;
    const calculatedTotalPages = Math.ceil(totalFilteredItems / itemsPerPage);
    setTotalPages(calculatedTotalPages);

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filtered.slice(startIndex, endIndex);

    // Update the filtered/paginated data
    setFilteredData(paginatedData);
  };

  // Handle table instance
  const handleTableReady = (table) => {
    setTableInstance(table);
  };

  // Handle data changes
  const handleDataChanged = () => {
    setRowSelection({});
    setRefreshTrigger(prev => prev + 1);
    setPage(1);

    if (onDataChanged) {
      onDataChanged();
    }
  };

  // Handle view order details
  const handleViewOrder = (order) => {
    setViewingOrder(order);
    setIsDetailsDialogOpen(true);
  };

  // Handle report generation
  const handleGenerateReport = (reportConfig) => {
    setIsGeneratingReport(true);

    // Get filtered data based on current filters and date range
    let reportData = [...orderData];

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      reportData = reportData.filter(order =>
        order.id.toLowerCase().includes(searchLower) ||
        (order.expand?.user?.name && order.expand.user.name.toLowerCase().includes(searchLower)) ||
        (order.guest_user && order.guest_user.toLowerCase().includes(searchLower))
      );
    }

    // Apply date range filter
    if (dateRange.from || dateRange.to) {
      reportData = reportData.filter(order => {
        const orderDate = new Date(order.delivery_completed_date || order.created);
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(dateRange.to) : null;

        if (fromDate && toDate) {
          return orderDate >= fromDate && orderDate <= toDate;
        } else if (fromDate) {
          return orderDate >= fromDate;
        } else if (toDate) {
          return orderDate <= toDate;
        }
        return true;
      });
    }

    // Generate CSV report
    generateCSVReport(reportData, reportConfig);

    setIsGeneratingReport(false);
    setIsReportDialogOpen(false);
  };

  // Generate CSV report
  const generateCSVReport = (data, config) => {
    const headers = ['Order ID', 'Customer', 'Status', 'Completion Date', 'Total Amount', 'Payment Method'];
    const csvContent = [
      headers.join(','),
      ...data.map(order => [
        order.id,
        order.expand?.user?.name || order.guest_user || 'N/A',
        order.status,
        order.delivery_completed_date || order.created,
        calculateOrderTotal(order),
        order.mode_of_payment || 'N/A'
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `order_history_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Calculate order total
  const calculateOrderTotal = (order) => {
    if (!order.expand?.products) return '0.00';

    return order.expand.products.reduce((total, product) => {
      const price = product.expand?.product_pricing?.[0]?.price || 0;
      return total + price;
    }, 0).toFixed(2);
  };

  // Handle print report
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintHTML(filteredData);

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Generate HTML for printing
  const generatePrintHTML = (data) => {
    const currentDate = new Date().toLocaleDateString();
    const dateRangeText = dateRange.from && dateRange.to
      ? `From ${new Date(dateRange.from).toLocaleDateString()} to ${new Date(dateRange.to).toLocaleDateString()}`
      : 'All completed orders';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order History Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Order History Report</h1>
          <p>Generated on: ${currentDate}</p>
          <p>Period: ${dateRangeText}</p>
        </div>
        <div class="info">
          <p><strong>Total Orders:</strong> ${data.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Completion Date</th>
              <th>Total Amount</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(order => `
              <tr>
                <td>${order.id}</td>
                <td>${order.expand?.user?.name || order.guest_user || 'N/A'}</td>
                <td>${order.delivery_completed_date || order.created}</td>
                <td>₱${calculateOrderTotal(order)}</td>
                <td>${order.mode_of_payment || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className='w-full flex-1 flex flex-col gap-4'>
      <div className='w-full bg-white rounded-sm shadow-sm p-4 flex flex-col gap-4 overflow-hidden'>
        {/* Role-based filtering info */}
        {user && (
          <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2">
            {user.role === 'super-admin' && (
              <span className="text-blue-700">
                ℹ️ Viewing completed orders from all branches (Super Admin)
              </span>
            )}
            {user.role === 'admin' && (
              <span className="text-blue-700">
                ℹ️ Viewing completed orders from your assigned branch only (Admin)
              </span>
            )}
          </div>
        )}

        {/* Filter component */}
        <Filters
          searchQuery={searchQuery}
          onSearchChange={(e) => console.log("Search handled by parent component")}
          onStatusChange={(value) => {
            setSelectedStatus(value);
            setPage(1);
          }}
          selectedStatus={selectedStatus}
        />

        {/* Divider line */}
        <div className='w-full h-[1px] bg-black/10' />

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex justify-center items-center py-10 text-red-500">
            Error: {error}
          </div>
        )}

        {/* Order Data Table */}
        {!isLoading && !error && (
          <DataTable
            data={filteredData}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            onTableReady={handleTableReady}
            onDataChanged={handleDataChanged}
            onViewOrder={handleViewOrder}
            user={user}
            isHistoryMode={true}
          />
        )}

        {/* Summary Statistics */}
        {!isLoading && !error && filteredData.length > 0 && (
          <div className="bg-gray-50 rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{filteredData.length}</p>
              <p className="text-sm text-gray-600">Completed Orders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ₱{filteredData.reduce((total, order) => total + parseFloat(calculateOrderTotal(order)), 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                ₱{(filteredData.reduce((total, order) => total + parseFloat(calculateOrderTotal(order)), 0) / filteredData.length).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Average Order Value</p>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && !error && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-raleway">
              Page {page} of {totalPages || 1}
            </span>

            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        order={viewingOrder}
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          setIsDetailsDialogOpen(open);
          if (!open) setViewingOrder(null);
        }}
        user={user}
        isHistoryMode={true}
      />

      {/* Report Generation Dialog */}
      <ReportDialog
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        onGenerateReport={handleGenerateReport}
        isGenerating={isGeneratingReport}
        orderCount={filteredData.length}
        dateRange={dateRange}
      />
    </div>
  );
});

OrderHistoryList.displayName = 'OrderHistoryList';

export default OrderHistoryList;