"use client";
import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { deleteOrder, deleteManyOrders } from '@/services/pocketbase/deleteOrders'
import { updateOrderStatus, updateBatchOrdersStatus } from '@/services/pocketbase/updateOrders'

// Add styles to hide scrollbar but keep scrolling functionality
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.type = 'text/css'
  styleSheet.innerText = `
    .scrollbar-hide {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;     /* Firefox */
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;            /* Chrome, Safari and Opera */
    }
  `
  document.head.appendChild(styleSheet)
}

const DataTable = ({
  data,
  rowSelection,
  setRowSelection,
  onTableReady,
  onDataChanged,
  onViewOrder
}) => {
  // State for delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    orderId: null,
    orderNumber: "",
    isBulkDelete: false,
  });

  // State for status update dialog
  const [statusDialog, setStatusDialog] = useState({
    isOpen: false,
    newStatus: "",
    title: "",
  });

  // State for loading indicators
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Define column configuration
  const columns = [
    // Checkbox column for selecting rows
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40, // Column width in pixels
    },

    // Order ID/Number column
    {
      accessorKey: "id",
      header: () => <div className="text-left font-medium">Order ID</div>,
      cell: ({ row }) => (
        <div className="text-left font-medium">{row.getValue("id")}</div>
      ),
      size: 120,
    },

    // Customer name column
    {
      id: "customerName",
      header: () => <div className="text-left font-medium">Customer</div>,
      cell: ({ row }) => {
        // Get the customer name from the expanded user data
        const customerName = row.original.expand?.user?.name || "Unknown Customer";
        return <div className="text-left">{customerName}</div>;
      },
    },

    // Order Date column
    {
      accessorKey: "created",
      header: () => <div className="text-left font-medium">Date</div>,
      cell: ({ row }) => {
        const date = new Date(row.getValue("created"));
        const formatted = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).format(date);
        return <div className="text-left">{formatted}</div>;
      },
      size: 120,
    },

    // Order Status column
    {
      accessorKey: "status",
      header: () => <div className="text-left font-medium">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue("status");
        return (
          <div className={`text-left py-1 px-2 rounded-full w-fit text-xs font-medium
            ${status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
              status === 'Approved' ? 'bg-green-100 text-green-800' :
              status === 'Declined' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'}`}>
            {status}
          </div>
        );
      },
      size: 100,
    },

    // Payment Method column
    {
      accessorKey: "mode_of_payment",
      header: () => <div className="text-left font-medium">Payment</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("mode_of_payment")}</div>
      ),
      size: 120,
    },

    // Products count column
    {
      id: "productsCount",
      header: () => <div className="text-center font-medium">Items</div>,
      cell: ({ row }) => {
        // Get the products array and return its length
        const products = row.original.products || [];
        return <div className="text-center">{products.length}</div>;
      },
      size: 70,
    },

    // Actions column (view, approve, decline, delete buttons)
    {
      id: "actions",
      header: () => <div className="text-right font-medium">Actions</div>,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className="flex gap-2 justify-end">
            {/* View Order Details */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleViewOrder(row.original)}
            >
              <Eye className="h-4 w-4" />
            </Button>

            {/* Approve button - only show for pending orders */}
            {status === 'Pending' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                onClick={() => handleStatusConfirmation('Approved', row.original)}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}

            {/* Decline button - only show for pending orders */}
            {status === 'Pending' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                onClick={() => handleStatusConfirmation('Declined', row.original)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}

            {/* Delete button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleDeleteConfirmation(row.original)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      size: 120,
    },
  ];

  // Create table instance with TanStack Table
  const table = useReactTable({
    data,
    columns,
    enableRowSelection: true,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 15, // Show 15 orders per page
      },
    },
  });

  // Give parent access to the table instance
  React.useEffect(() => {
    if (onTableReady) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

  // Handle viewing order details
  const handleViewOrder = (order) => {
    if (onViewOrder) {
      onViewOrder(order);
    }
  };

  // Handle delete confirmation for a single order
  const handleDeleteConfirmation = (order) => {
    setDeleteDialog({
      isOpen: true,
      orderId: order.id,
      orderNumber: order.id,
      isBulkDelete: false
    });
  };

  // Handle bulk delete confirmation
  const handleBulkDeleteConfirmation = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length > 0) {
      setDeleteDialog({
        isOpen: true,
        orderId: selectedRows.map(row => row.original.id),
        orderNumber: `${selectedRows.length} orders`,
        isBulkDelete: true
      });
    }
  };

  // Execute order deletion
  const handleDeleteOrder = async () => {
    setIsDeleting(true);
    try {
      if (deleteDialog.isBulkDelete) {
        // Delete multiple orders with simplified function
        await deleteManyOrders(deleteDialog.orderId);
      } else {
        // Delete single order with simplified function
        await deleteOrder(deleteDialog.orderId);
      }

      // Clear row selection after deletion
      setRowSelection({});

      // Notify parent that data has changed
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (error) {
      console.error("Error deleting order(s):", error);
      alert(`Failed to delete: ${error.message}`);
    } finally {
      setIsDeleting(false);
      // Close the dialog
      setDeleteDialog({ isOpen: false, orderId: null, orderNumber: "" });
    }
  };

  // Handle status update confirmation for a single order
  const handleStatusConfirmation = (newStatus, order) => {
    setStatusDialog({
      isOpen: true,
      newStatus: newStatus,
      title: `${newStatus} Order #${order.id}`,
      isBulk: false,
      orderId: order.id
    });
  };

  // Handle bulk status update confirmation
  const handleBulkStatusUpdate = (newStatus) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length > 0) {
      setStatusDialog({
        isOpen: true,
        newStatus: newStatus,
        title: `${newStatus} ${selectedRows.length} Orders`,
        isBulk: true,
        orderId: selectedRows.map(row => row.original.id)
      });
    }
  };

  // Execute status update
  const handleUpdateStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      if (statusDialog.isBulk) {
        // Update multiple orders with simplified function
        await updateBatchOrdersStatus(
          statusDialog.orderId,
          statusDialog.newStatus
        );
      } else {
        // Update single order with simplified function
        await updateOrderStatus(
          statusDialog.orderId,
          statusDialog.newStatus
        );
      }

      // Clear row selection after update
      setRowSelection({});

      // Notify parent that data has changed
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert(`Failed to update status: ${error.message}`);
    } finally {
      setIsUpdatingStatus(false);
      // Close the dialog
      setStatusDialog({ isOpen: false, newStatus: "", title: "" });
    }
  };

  return (
    <>
      {/* Order Table Container */}
      <div className="rounded-md border overflow-hidden flex-1 flex flex-col">
        {/* Bulk action buttons - shows when items are selected */}
        {Object.keys(rowSelection).length > 0 && (
          <div className="bg-gray-50 p-2 flex justify-between items-center border-b">
            <span className="text-sm text-gray-600 ml-2">
              {Object.keys(rowSelection).length} item(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => handleBulkStatusUpdate('Approved')}
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Approve Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => handleBulkStatusUpdate('Declined')}
              >
                <XCircle className="h-4 w-4 mr-1" /> Decline Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDeleteConfirmation}
                className="mr-2"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Table with hidden scrollbar */}
        <div className="overflow-auto flex-1 scrollbar-hide">
          <Table>
            {/* Table Header */}
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="px-4 py-3 bg-gray-50"
                      style={{
                        width: header.column.columnDef.size,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            {/* Table Body */}
            <TableBody>
              {table.getRowModel().rows?.length ? (
                // Map through rows if we have data
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {/* Render cells for each row */}
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-3"
                        style={{
                          width: cell.column.columnDef.size,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                // Show this if no data found
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !isDeleting && setDeleteDialog(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.isBulkDelete
                ? `You are about to delete ${deleteDialog.orderNumber}.`
                : `You are about to delete Order #${deleteDialog.orderNumber}.`}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Update Confirmation Dialog */}
      <AlertDialog open={statusDialog.isOpen} onOpenChange={(open) => !isUpdatingStatus && setStatusDialog(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{statusDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusDialog.isBulk
                ? `Are you sure you want to mark ${statusDialog.newStatus.toLowerCase()} ${Object.keys(rowSelection).length} orders?`
                : `Are you sure you want to mark this order as ${statusDialog.newStatus.toLowerCase()}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateStatus}
              disabled={isUpdatingStatus}
              className={`${
                statusDialog.newStatus === 'Approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              {isUpdatingStatus ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DataTable;