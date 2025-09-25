"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Filters from './Filters';
import DataTable from './DataTable';
import OrderDetailsDialog from './OrderDetailsDialog';
import { Button } from '@/components/ui/button';
import { getOrdersByRole } from '@/services/pocketbase/readOrders';
import { getProductWithAllData } from '@/services/pocketbase/readProducts';

const OrderList = forwardRef(({ searchQuery = "", onDataChanged, user }, ref) => {
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

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Expose handleRefresh function to parent component through ref
  useImperativeHandle(ref, () => ({
    handleRefresh: () => {
      setRefreshTrigger(prev => prev + 1);
    }
  }));

  // Fetch all orders
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        // Always use role-based filtering - if no user, return empty array
        if (!user) {
          console.warn("No authenticated user found, cannot fetch orders");
          setOrderData([]);
          return;
        }

        const allOrders = await getOrdersByRole(user);
        setOrderData(allOrders);

        // Apply filters and pagination
        applyFiltersAndPagination(allOrders, searchQuery, selectedStatus, page, perPage);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err?.message || 'Failed to fetch orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [refreshTrigger, user]);

  // Apply filters and pagination when dependencies change
  useEffect(() => {
    if (orderData.length > 0) {
      applyFiltersAndPagination(orderData, searchQuery, selectedStatus, page, perPage);
    }
  }, [searchQuery, selectedStatus, page, perPage, orderData]);

  // Function to apply filters and pagination client-side
  const applyFiltersAndPagination = (data, search, status, currentPage, itemsPerPage) => {
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
                ℹ️ Viewing all orders from all branches (Super Admin)
              </span>
            )}
            {user.role === 'admin' && (
              <span className="text-blue-700">
                ℹ️ Viewing orders from your assigned branch only (Admin)
              </span>
            )}
            {user.role !== 'super-admin' && user.role !== 'admin' && (
              <span className="text-blue-700">
                ℹ️ Viewing your orders only
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
          />
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

      {/* Order Details Dialog - now moved to a separate component */}
      <OrderDetailsDialog
        order={viewingOrder}
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          setIsDetailsDialogOpen(open);
          if (!open) setViewingOrder(null);
        }}
        user={user}
      />
    </div>
  );
});

OrderList.displayName = 'OrderList';

export default OrderList;