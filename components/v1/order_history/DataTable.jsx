"use client";
import React, { useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar, CreditCard, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';

const DataTable = ({
  data = [],
  rowSelection,
  setRowSelection,
  onTableReady,
  onViewOrder,
  user,
  isHistoryMode = true
}) => {
  // Calculate order total
  const calculateOrderTotal = (order) => {
    if (!order.expand?.products) return '0.00';

    return order.expand.products.reduce((total, product) => {
      const price = product.expand?.product_pricing?.[0]?.price || 0;
      return total + price;
    }, 0).toFixed(2);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  // Define columns for order history
  const columns = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => (
        <div className="font-mono text-sm text-blue-600">
          #{row.getValue("id").slice(-8).toUpperCase()}
        </div>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const order = row.original;
        const customerName = order.expand?.user?.name || order.guest_user || 'N/A';
        const customerEmail = order.expand?.user?.email || 'Guest';

        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <div className="font-medium">{customerName}</div>
              <div className="text-xs text-gray-500">{customerEmail}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "delivery_completed_date",
      header: "Completion Date",
      cell: ({ row }) => {
        const order = row.original;
        const completionDate = order.delivery_completed_date || order.created;

        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{formatDate(completionDate)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "total_amount",
      header: "Total Amount",
      cell: ({ row }) => {
        const order = row.original;
        const total = calculateOrderTotal(order);

        return (
          <div className="font-semibold text-green-600">
            ₱{total}
          </div>
        );
      },
    },
    {
      accessorKey: "mode_of_payment",
      header: "Payment Method",
      cell: ({ row }) => {
        const paymentMethod = row.getValue("mode_of_payment") || 'N/A';

        return (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <Badge variant="secondary" className="text-xs">
              {paymentMethod}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "address",
      header: "Delivery Address",
      cell: ({ row }) => {
        const order = row.original;
        const address = order.expand?.address;

        if (!address) return <span className="text-gray-500 text-sm">N/A</span>;

        return (
          <div className="flex items-center gap-2 max-w-xs">
            <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <div className="text-sm truncate">
              <div className="font-medium">{address.name}</div>
              <div className="text-xs text-gray-500">{address.address}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            Completed
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewOrder(order)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Initialize the table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  // Notify parent when table is ready
  useEffect(() => {
    if (onTableReady) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
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
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="hover:bg-gray-50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2" />
                    No completed orders found.
                  </div>
                  <p className="text-sm text-gray-400">
                    Completed orders will appear here once they are delivered.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DataTable;