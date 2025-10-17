"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Filters from './Filters';
import DataTable from './DataTable';
import OrderDetailsDialog from '../orders/OrderDetailsDialog';
import { Button } from '@/components/ui/button';
import { getOrdersByRole } from '@/services/pocketbase/readOrders';
import { Printer } from 'lucide-react';

const OrderHistoryList = forwardRef(({ searchQuery = "", onDataChanged, user }, ref) => {
  // State for order data
  const [orderData, setOrderData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for pagination
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [filteredData, setFilteredData] = useState([]);

  // State for date filtering
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

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

  // Fetch all completed orders
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

        // Filter to only show completed orders
        const completedOrders = allOrders.filter(order => order.status === 'completed');
        setOrderData(completedOrders);

        // Apply filters and pagination
        applyFiltersAndPagination(completedOrders, searchQuery, startDate, endDate, page, perPage);
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
      applyFiltersAndPagination(orderData, searchQuery, startDate, endDate, page, perPage);
    }
  }, [searchQuery, startDate, endDate, page, perPage, orderData]);

  // Function to apply filters and pagination client-side
  const applyFiltersAndPagination = (data, search, start, end, currentPage, itemsPerPage) => {
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

    // Apply date range filter if provided
    if (start || end) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created);

        if (start && end) {
          const startDateTime = new Date(start);
          startDateTime.setHours(0, 0, 0, 0);
          const endDateTime = new Date(end);
          endDateTime.setHours(23, 59, 59, 999);
          return orderDate >= startDateTime && orderDate <= endDateTime;
        } else if (start) {
          const startDateTime = new Date(start);
          startDateTime.setHours(0, 0, 0, 0);
          return orderDate >= startDateTime;
        } else if (end) {
          const endDateTime = new Date(end);
          endDateTime.setHours(23, 59, 59, 999);
          return orderDate <= endDateTime;
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

  // Handle print report
  const handlePrintReport = () => {
    // Get filtered data based on current date range
    let dataToPrint = orderData;

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      dataToPrint = dataToPrint.filter(order =>
        order.id.toLowerCase().includes(searchLower) ||
        (order.expand?.user?.name && order.expand.user.name.toLowerCase().includes(searchLower)) ||
        (order.guest_user && order.guest_user.toLowerCase().includes(searchLower)) ||
        (order.expand?.address?.name && order.expand.address.name.toLowerCase().includes(searchLower)) ||
        (order.expand?.address?.phone && order.expand.address.phone.includes(searchQuery))
      );
    }

    if (startDate || endDate) {
      dataToPrint = dataToPrint.filter(order => {
        const orderDate = new Date(order.created);

        if (startDate && endDate) {
          const startDateTime = new Date(startDate);
          startDateTime.setHours(0, 0, 0, 0);
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          return orderDate >= startDateTime && orderDate <= endDateTime;
        } else if (startDate) {
          const startDateTime = new Date(startDate);
          startDateTime.setHours(0, 0, 0, 0);
          return orderDate >= startDateTime;
        } else if (endDate) {
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          return orderDate <= endDateTime;
        }

        return true;
      });
    }

    // Calculate totals
    const totalOrders = dataToPrint.length;
    const totalRevenue = dataToPrint.reduce((sum, order) => sum + (order.total_price || 0), 0);

    // Create print window
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('Please allow popups to print the report');
      return;
    }

    // Generate HTML for print
    const dateRangeText = startDate && endDate
      ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
      : startDate
        ? `From ${new Date(startDate).toLocaleDateString()}`
        : endDate
          ? `Until ${new Date(endDate).toLocaleDateString()}`
          : 'All Time';

    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order History Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0 0 10px 0;
              color: #333;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .summary {
              display: flex;
              justify-content: space-around;
              margin: 20px 0;
              padding: 15px;
              background: #f5f5f5;
              border-radius: 5px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-item .label {
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .summary-item .value {
              font-size: 20px;
              font-weight: bold;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #0A1727;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            td ul {
              margin: 0;
              padding-left: 20px;
              list-style-type: none;
            }
            td ul li {
              padding: 3px 0;
              border-bottom: 1px dotted #ddd;
            }
            td ul li:last-child {
              border-bottom: none;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order History Report</h1>
            <p><strong>Date Range:</strong> ${dateRangeText}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="label">Total Orders</div>
              <div class="value">${totalOrders}</div>
            </div>
            <div class="summary-item">
              <div class="label">Total Revenue</div>
              <div class="value">₱${totalRevenue.toFixed(2)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Products</th>
                <th>Delivery Fee</th>
                <th>Total Price</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${dataToPrint.map(order => {
                // Build product list with prices
                let productList = 'N/A';
                let productTotal = 0;

                if (order.expand?.products && order.expand.products.length > 0) {
                  productList = '<ul style="margin: 0; padding-left: 20px;">';

                  order.expand.products.forEach((product, index) => {
                    const productName = product.product_name || 'Unknown Product';

                    // Try multiple ways to get the price
                    let price = 0;

                    // Method 1: Check expand.product_pricing array
                    if (order.expand?.product_pricing && order.expand.product_pricing[index]) {
                      const pricing = order.expand.product_pricing[index];
                      price = pricing.final_price || pricing.price || 0;
                    }
                    // Method 2: Check if product has pricing directly
                    else if (product.final_price !== undefined) {
                      price = product.final_price;
                    }
                    else if (product.price !== undefined) {
                      price = product.price;
                    }
                    // Method 3: Check if pricing is embedded in the product expand
                    else if (product.expand?.product_pricing) {
                      const pricing = Array.isArray(product.expand.product_pricing)
                        ? product.expand.product_pricing[0]
                        : product.expand.product_pricing;
                      price = pricing?.final_price || pricing?.price || 0;
                    }

                    productTotal += price;
                    productList += '<li><strong>' + productName + '</strong>: ₱' + price.toFixed(2) + '</li>';
                  });

                  productList += '</ul>';
                } else if (order.products && order.products.length > 0) {
                  // Fallback: If no expanded products, just show IDs or count
                  productList = order.products.length + ' product(s)';
                }

                const deliveryFee = order.delivery_fee || 0;
                const calculatedTotal = productTotal + deliveryFee;
                const displayTotal = order.total_price || calculatedTotal;

                return `
                  <tr>
                    <td>${order.id}</td>
                    <td>${order.expand?.user?.name || order.guest_user || 'N/A'}</td>
                    <td>${productList}</td>
                    <td>₱${deliveryFee.toFixed(2)}</td>
                    <td><strong>₱${displayTotal.toFixed(2)}</strong></td>
                    <td>${new Date(order.created).toLocaleDateString()}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>This is a computer-generated report. No signature required.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();
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
            {user.role !== 'super-admin' && user.role !== 'admin' && (
              <span className="text-blue-700">
                ℹ️ Viewing your completed orders only
              </span>
            )}
          </div>
        )}

        {/* Filter component */}
        <Filters
          searchQuery={searchQuery}
          onSearchChange={(e) => console.log("Search handled by parent component")}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onPrintReport={handlePrintReport}
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

OrderHistoryList.displayName = 'OrderHistoryList';

export default OrderHistoryList;
