"use client";
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel, // Import if sorting is needed later
} from '@tanstack/react-table';

// Define columns for the parts history table
const columns = [
  {
    accessorKey: "expand.part.name",
    header: () => <div className="text-left font-medium">Part Name</div>,
    cell: ({ row }) => (
      <div className="text-left">{row.original.expand?.part?.name || 'N/A'}</div>
    ),
    size: 200,
  },
  {
    accessorKey: "change_quantity",
    header: () => <div className="text-center font-medium">Change</div>,
    cell: ({ row }) => {
      const change = row.getValue("change_quantity");
      return (
        <div className={`text-center font-medium ${change < 0 ? 'text-red-600' : 'text-green-600'}`}>
          {change > 0 ? `+${change}` : change}
        </div>
      );
    },
    size: 80,
  },
  {
    accessorKey: "type",
    header: () => <div className="text-left font-medium">Type</div>,
    cell: ({ row }) => <div className="text-left">{row.getValue("type")}</div>,
    size: 100,
  },
  {
    accessorKey: "expand.related_service.id", // Corrected accessorKey
    header: () => <div className="text-left font-medium">Related Service ID</div>,
    cell: ({ row }) => (
      // Corrected access to the id field
      <div className="text-left">{row.original.expand?.related_service?.id || '-'}</div>
    ),
    size: 150,
  },
  {
    accessorKey: "notes",
    header: () => <div className="text-left font-medium">Notes</div>,
    cell: ({ row }) => (
      <div className="text-left max-w-[250px] truncate" title={row.getValue("notes")}>
        {row.getValue("notes") || '-'}
      </div>
    ),
    size: 250,
  },
  {
    accessorKey: "created",
    header: () => <div className="text-left font-medium">Date</div>,
    cell: ({ row }) => (
      <div className="text-left">{new Date(row.getValue("created")).toLocaleString()}</div>
    ),
    size: 180,
  },
];

const DataTable = ({ data, isLoading, error }) => {
  // Create table instance with TanStack Table
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    // getSortedRowModel: getSortedRowModel(), // Enable if sorting is added
  });

  // Show loading state with spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        Error loading history: {error}
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden bg-white shadow-sm">
      <div className="overflow-auto">
        <Table>
          {/* Table Header */}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-4 py-3 bg-gray-50" // Consistent header styling
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
                <TableRow key={row.id}>
                  {/* Render cells for each row */}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-3" // Consistent cell padding
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
                  No parts usage history found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DataTable;
