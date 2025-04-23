"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { getProductWithAllData } from '@/services/pocketbase/readProducts';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { updateOrderStatus } from '@/services/pocketbase/updateOrders';

const OrderDetailsDialog = ({
  order,
  open,
  onOpenChange
}) => {
  // State for storing product details
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(order?.status || 'Pending');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Update status when order changes
  useEffect(() => {
    if (order?.status) {
      setStatus(order.status);
    }
  }, [order]);

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (!order || newStatus === status) return;

    setIsUpdatingStatus(true);
    try {
      // Use the simplified updateOrderStatus function
      const updatedOrder = await updateOrderStatus(order.id, newStatus);
      setStatus(updatedOrder.status);
    } catch (error) {
      console.error("Error updating order status:", error);
      alert(`Failed to update status: ${error.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle print functionality
  const handlePrint = () => {
    // Create a printable version of the order details
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <html>
        <head>
          <title>Order #${order.id} - Details</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            h2 { font-size: 16px; margin: 15px 0 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-group { margin-bottom: 15px; }
            .info-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .address { background-color: #f9f9f9; padding: 10px; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .text-right { text-align: right; }
            .status-pill {
              padding: 2px 8px;
              border-radius: 10px;
              font-size: 12px;
              font-weight: 500;
              display: inline-block;
            }
            .status-pending { background-color: #FEF3C7; color: #92400E; }
            .status-approved { background-color: #D1FAE5; color: #065F46; }
            .status-declined { background-color: #FEE2E2; color: #B91C1C; }
            tfoot td { font-weight: bold; }
            @media print {
              body { margin: 0; padding: 15px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Order Details - #${order.id}</h1>

          <div class="grid">
            <div class="info-group">
              <h2>Order Information</h2>
              <div class="info-item">
                <span>Date:</span>
                <span>${new Date(order.created).toLocaleDateString()}</span>
              </div>
              <div class="info-item">
                <span>Status:</span>
                <span class="status-pill status-${order.status?.toLowerCase()}">${order.status}</span>
              </div>
              <div class="info-item">
                <span>Method:</span>
                <span>${order.mode_of_payment}</span>
              </div>
              <div class="info-item">
                <span>Delivery Fee:</span>
                <span>${formatCurrency(order.delivery_fee)}</span>
              </div>
              ${order.distance !== null && order.distance !== undefined ? `
              <div class="info-item">
                <span>Distance:</span>
                <span>${Number(order.distance).toFixed(2)} km</span>
              </div>
              ` : ''}
              <div class="info-item">
                <span>Total Amount:</span>
                <span>${formatCurrency(calculateOrderTotal())}</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
    };
  };

  // Fetch product details when order changes
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!order || !order.products || order.products.length === 0) return;

      setIsLoading(true);
      try {
        // Fetch details for each product ID
        const productPromises = order.products.map(productId =>
          getProductWithAllData(productId)
        );
        const productResults = await Promise.all(productPromises);
        setProducts(productResults);
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open && order) {
      fetchProductDetails();
    }
  }, [order, open]);

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Calculate order total
  const calculateOrderTotal = () => {
    if (!order) return 0;

    let total = 0;

    // Sum up product prices
    products.forEach(product => {
      let price = 0;
      if (product.pricing?.final_price) {
        price = parseFloat(product.pricing.final_price);
      }
      total += price || 0;
    });

    // Add delivery fee
    const deliveryFee = order.delivery_fee || 0;
    return total + deliveryFee;
  };

  // If no order is provided, don't render anything
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Order ID: {order.id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Order Information */}
          <div>
            <h3 className="font-semibold mb-2">Order Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{new Date(order.created).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method:</span>
                <span>{order.mode_of_payment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee:</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
              {order.distance !== null && order.distance !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance:</span>
                  <span>{Number(order.distance).toFixed(2)} km</span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>Total Amount:</span>
                <span>{formatCurrency(calculateOrderTotal())}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span>{order.expand?.user?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{order.expand?.user?.email || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span>{order.expand?.address?.phone || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Shipping Address</h3>
          <div className="text-sm bg-gray-50 p-3 rounded-md">
            <div>{order.expand?.address?.name}</div>
            <div>{order.expand?.address?.address}</div>
            <div>{order.expand?.address?.city}, {order.expand?.address?.zip_code}</div>
            <div>{order.expand?.address?.phone}</div>
            {order.expand?.address?.additional_notes && (
              <div className="mt-2 italic">{order.expand.address.additional_notes}</div>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Products</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="px-3 py-2 text-center">
                      <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : products.length > 0 ? (
                  // Display product details
                  products.map((product, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          {product.product_name || "Unknown Product"}
                          <span className="ml-2 text-xs text-gray-500">({product.id})</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{product.brand || "N/A"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                        {formatCurrency(product.pricing?.final_price || 0)}
                      </td>
                    </tr>
                  ))
                ) : order.products && order.products.length > 0 ? (
                  // If we have product IDs but no details yet
                  order.products.map((productId, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm" colSpan={2}>
                        {productId}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                        Loading...
                      </td>
                    </tr>
                  ))
                ) : (
                  // If no products
                  <tr>
                    <td colSpan="3" className="px-3 py-2 text-center text-sm text-gray-500">
                      No products
                    </td>
                  </tr>
                )}
              </tbody>
              {products.length > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="2" className="px-3 py-2 text-right font-medium text-sm">
                      Subtotal:
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-sm">
                      {formatCurrency(calculateOrderTotal() - (order.delivery_fee || 0))}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="2" className="px-3 py-2 text-right text-sm">
                      Delivery Fee:
                    </td>
                    <td className="px-3 py-2 text-right text-sm">
                      {formatCurrency(order.delivery_fee || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="2" className="px-3 py-2 text-right font-medium text-sm">
                      Total:
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-sm">
                      {formatCurrency(calculateOrderTotal())}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <DialogFooter className="mt-4 flex items-center gap-2">
          {/* Status Dropdown */}
          <div className="mr-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`px-3 py-1 flex items-center ${
                    status === 'Pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                    status === 'Approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                    status === 'Declined' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                    'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
                      Updating...
                    </span>
                  ) : (
                    <>
                      Status: {status} <ChevronDownIcon className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleStatusChange('Pending')}>
                  <div className="flex items-center">
                    {status === 'Pending' && <CheckIcon className="mr-2 h-4 w-4" />}
                    <span className={`${status === 'Pending' ? 'font-medium' : ''}`}>Pending</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('Approved')}>
                  <div className="flex items-center">
                    {status === 'Approved' && <CheckIcon className="mr-2 h-4 w-4" />}
                    <span className={`${status === 'Approved' ? 'font-medium' : ''}`}>Approved</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('Declined')}>
                  <div className="flex items-center">
                    {status === 'Declined' && <CheckIcon className="mr-2 h-4 w-4" />}
                    <span className={`${status === 'Declined' ? 'font-medium' : ''}`}>Declined</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Action Buttons */}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline" className="hover:bg-blue-300" onClick={handlePrint}>
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;