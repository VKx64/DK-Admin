"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Filters from './Filters';
import DataTable from './DataTable';
import CustomerDetailsDialog from './CustomerDetailsDialog';
import { Button } from '@/components/ui/button';
import { getCustomersWithOrderStats } from '@/services/pocketbase/readCustomers';
import { Icon } from '@iconify/react';

const CustomerList = forwardRef(({ user }, ref) => {
  // State for customer data
  const [customerData, setCustomerData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for pagination
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [filteredData, setFilteredData] = useState([]);

  // State for filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");

  // State for viewing customer details
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Expose handleRefresh function to parent component through ref
  useImperativeHandle(ref, () => ({
    handleRefresh: () => {
      setRefreshTrigger(prev => prev + 1);
    }
  }));

  // Fetch all customers with order statistics
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        if (!user) {
          console.warn("No authenticated user found, cannot fetch customers");
          setCustomerData([]);
          return;
        }

        const allCustomers = await getCustomersWithOrderStats(user);
        setCustomerData(allCustomers);

        // Apply filters and pagination
        applyFiltersAndPagination(allCustomers, searchQuery, selectedBranch, page, perPage);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError(err?.message || 'Failed to fetch customers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [refreshTrigger, user]);

  // Apply filters and pagination when dependencies change
  useEffect(() => {
    if (customerData.length > 0) {
      applyFiltersAndPagination(customerData, searchQuery, selectedBranch, page, perPage);
    } else if (customerData.length === 0 && !isLoading) {
      setFilteredData([]);
      setTotalPages(0);
    }
  }, [searchQuery, selectedBranch, page, perPage, customerData, isLoading]);

  // Function to apply filters and pagination client-side
  const applyFiltersAndPagination = (data, search, branch, currentPage, itemsPerPage) => {
    let filtered = data;

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(customer =>
        (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
        (customer.id && customer.id.toLowerCase().includes(searchLower))
      );
    }

    // Apply branch filter if provided (super-admin only)
    if (user?.role === 'super-admin' && branch && branch !== 'all') {
      if (branch === 'no-orders') {
        // Filter customers with no orders (no lastOrderBranch)
        filtered = filtered.filter(customer => !customer.lastOrderBranch);
      } else {
        // Filter customers by their last order branch
        filtered = filtered.filter(customer => customer.lastOrderBranch === branch);
      }
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

  // Handle view customer details
  const handleViewCustomer = (customer) => {
    setViewingCustomer(customer);
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
                ℹ️ Viewing all customers (Super Admin) - Use filter to see customers by their last order branch
              </span>
            )}
            {user.role === 'admin' && (
              <span className="text-blue-700">
                ℹ️ Viewing customers who last ordered from your branch (Admin)
              </span>
            )}
          </div>
        )}

        {/* Filter component */}
        <Filters
          searchQuery={searchQuery}
          onSearchChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          selectedBranch={selectedBranch}
          onBranchChange={(value) => {
            setSelectedBranch(value);
            setPage(1);
          }}
          userRole={user?.role}
        />

        {/* Divider line */}
        <div className='w-full h-[1px] bg-black/10' />

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Icon icon="mdi:loading" className="w-10 h-10 animate-spin text-indigo-600" />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col justify-center items-center py-10 text-red-500">
            <Icon icon="mdi:alert-circle" className="w-12 h-12 mb-2" />
            <p>Error: {error}</p>
            <Button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="mt-4"
              variant="outline"
            >
              <Icon icon="mdi:refresh" className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Data table */}
        {!isLoading && !error && (
          <>
            <DataTable
              data={filteredData}
              onViewCustomer={handleViewCustomer}
              user={user}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between py-2">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({customerData.length} total customers)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* No results message */}
            {filteredData.length === 0 && customerData.length > 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <Icon icon="mdi:filter-off" className="w-12 h-12 mb-2 opacity-50" />
                <p>No customers match your filters</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedBranch("all");
                    setPage(1);
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Details Dialog */}
      <CustomerDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        customer={viewingCustomer}
      />
    </div>
  );
});

CustomerList.displayName = 'CustomerList';

export default CustomerList;
