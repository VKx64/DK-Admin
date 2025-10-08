"use client";
import React from 'react'
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
import { Eye } from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'

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
  onViewOrder,
  user
}) => {
  // Define column configuration (view-only for history)
  const columns = [
    // Checkbox column for selecting rows (for potential export functionality)
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
      size: 40,
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
        const customerName = row.original.guest_user || row.original.expand?.user?.name || "N/A";
        return <div className="text-left">{customerName}</div>;
      },
      size: 150,
    },

    // Branch column (only for super-admin users)
    ...(user?.role === 'super-admin' ? [{
      id: "branchName",
      header: () => <div className="text-left font-medium">Branch</div>,
      cell: ({ row }) => {
        const branchName = row.original.expand?.branch?.branch_name || "N/A";
        return <div className="text-left">{branchName}</div>;
      },
      size: 120,
    }] : []),

    // Order Date column
    {
      accessorKey: "created",
      header: () => <div className="text-left font-medium">Date</div>,
      cell: ({ row }) => {
        const date = new Date(row.getValue("created"));
        const formatted = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
        return <div className="text-left">{formatted}</div>;
      },
      size: 150,
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
        const products = row.original.products || [];
        return <div className="text-center">{products.length}</div>;
      },
      size: 70,
    },

    // Total Price column
    {
      accessorKey: "total_price",
      header: () => <div className="text-right font-medium">Total</div>,
      cell: ({ row }) => {
        const amount = row.getValue("total_price") || 0;
        const formatted = new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
        }).format(amount);
        return <div className="text-right font-medium">{formatted}</div>;
      },
      size: 120,
    },

    // Actions column (view only)
    {
      id: "actions",
      header: () => <div className="text-right font-medium">Actions</div>,
      cell: ({ row }) => {
        const order = row.original;

        return (
          <div className="flex gap-2 justify-end">
            {/* View Order Details */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleViewOrder(order)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      size: 80,
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
        pageSize: 15,
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

  return (
    <>
      {/* Order Table Container */}
      <div className="rounded-md border overflow-hidden flex-1 flex flex-col">
        {/* Selection info - shows when items are selected */}
        {Object.keys(rowSelection).length > 0 && (
          <div className="bg-gray-50 p-2 flex justify-between items-center border-b">
            <span className="text-sm text-gray-600 ml-2">
              {Object.keys(rowSelection).length} item(s) selected
            </span>
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
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
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
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No completed orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default DataTable;
