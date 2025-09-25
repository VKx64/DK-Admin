"use client";
import React, { useState } from 'react'; // Import useState
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Icon } from "@iconify/react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
} from '@tanstack/react-table';
import ViewParts from './ViewParts'; // Import the ViewParts component
import EditParts from './EditParts'; // Import the EditParts component
import AdjustStock from './AdjustStock'; // Import the AdjustStock component

const DataTable = ({ data, isLoading, error, onRefresh }) => { // Added onRefresh prop
  // State for ViewParts dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPartForView, setSelectedPartForView] = useState(null);

  // State for EditParts dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPartForEdit, setSelectedPartForEdit] = useState(null);

  // State for AdjustStock dialog
  const [isAdjustStockDialogOpen, setIsAdjustStockDialogOpen] = useState(false);
  const [selectedPartForAdjust, setSelectedPartForAdjust] = useState(null);

  // Define column configuration for parts data
  const columns = [
    // Image column
    {
      id: "image",
      header: () => <div className="text-center font-medium">Image</div>,
      cell: ({ row }) => {
        const imageUrl = row.original.image
          ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${row.original.collectionId}/${row.original.id}/${row.original.image}`
          : "/Images/default_user.jpg";

        return (
          <div className="flex justify-center items-center">
            <div className="h-10 w-10 relative rounded-md overflow-hidden border border-gray-950/20">
              <Image
                src={imageUrl}
                alt={row.original.name || "Part image"}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          </div>
        );
      },
      enableSorting: false,
      size: 70,
    },

    // Name column
    {
      accessorKey: "name",
      header: () => <div className="text-left font-medium">Name</div>,
      cell: ({ row }) => (
        <div className="text-left font-medium">{row.getValue("name")}</div>
      ),
      size: 180,
    },

    // Part number column
    {
      accessorKey: "part_number",
      header: () => <div className="text-left font-medium">Part Number</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("part_number")}</div>
      ),
      size: 120,
    },

    // Brand column
    {
      accessorKey: "brand",
      header: () => <div className="text-left font-medium">Brand</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("brand")}</div>
      ),
      size: 120,
    },

    // Description column
    {
      accessorKey: "description",
      header: () => <div className="text-left font-medium">Description</div>,
      cell: ({ row }) => (
        <div className="text-left max-w-[200px] truncate" title={row.getValue("description")}>
          {row.getValue("description") || "-"}
        </div>
      ),
      size: 200,
    },

    // Price column
    {
      accessorKey: "price",
      header: () => <div className="text-right font-medium">Price</div>,
      cell: ({ row }) => {
        // Format the price value
        const price = row.getValue("price");
        const formatted = price ? new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(price) : "-";
        return <div className="text-right font-medium">{formatted}</div>;
      },
      size: 80,
    },

    // Stock column
    {
      accessorKey: "stocks",
      header: () => <div className="text-center font-medium">Stock</div>,
      cell: ({ row }) => {
        const stock = row.getValue("stocks");
        const threshold = row.original.reorder_threshold; // Get threshold for comparison
        const isLowStock = threshold !== null && threshold !== undefined && stock <= threshold;
        return (
          <div className={`text-center ${isLowStock ? "text-red-600 font-semibold" : ""}`}>
            {stock !== null && stock !== undefined ? stock : "-"}
          </div>
        );
      },
      size: 70,
    },

    // Reorder Threshold column
    {
      accessorKey: "reorder_threshold",
      header: () => <div className="text-center font-medium">Reorder At</div>,
      cell: ({ row }) => {
        const threshold = row.getValue("reorder_threshold");
        return (
          <div className="text-center">
            {threshold !== null && threshold !== undefined ? threshold : "-"}
          </div>
        );
      },
      size: 100, // Adjusted size
    },

    // Actions column with iconify icons (view, edit, delete, adjust stock)
    {
      id: "actions",
      header: () => <div className="text-right font-medium">Actions</div>,
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          {/* View button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleViewPart(row.original)}
          >
            <Icon icon="mdi:eye-outline" width={16} />
          </Button>

          {/* Edit button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleEditPart(row.original)} // Updated onClick
          >
            <Icon icon="mdi:pencil-outline" width={16} />
          </Button>

          {/* Adjust Stock button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => handleAdjustStock(row.original)}
            title="Adjust Stock"
          >
            <Icon icon="mdi:plus-minus-variant" width={16} />
          </Button>

          {/* Delete button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDeletePart(row.original)}
          >
            <Icon icon="mdi:trash-can-outline" width={16} />
          </Button>
        </div>
      ),
      size: 150, // Adjusted size to accommodate the new button
    }
  ];

  // Create table instance with TanStack Table
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Handler functions for actions
  const handleViewPart = (part) => {
    setSelectedPartForView(part); // Set the selected part
    setIsViewDialogOpen(true); // Open the dialog
  };

  const handleEditPart = (part) => {
    setSelectedPartForEdit(part); // Set the selected part for editing
    setIsEditDialogOpen(true); // Open the edit dialog
  };

  const handleAdjustStock = (part) => {
    setSelectedPartForAdjust(part); // Set the selected part for stock adjustment
    setIsAdjustStockDialogOpen(true); // Open the adjust stock dialog
  };

  const handleDeletePart = (part) => {
    console.log('Delete part:', part);
    // Placeholder for delete functionality
    // This would typically show a confirmation dialog before deleting
  };

  // Show loading state
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
        Error: {error}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-hidden bg-white">
        <div className="overflow-auto">
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
                  <TableRow key={row.id}>
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
                    No parts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Render ViewParts Dialog */}
      <ViewParts
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        part={selectedPartForView}
      />

      {/* Render EditParts Dialog */}
      <EditParts
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        part={selectedPartForEdit}
        onPartUpdated={() => {
          if (onRefresh) {
            onRefresh(); // Call the refresh function passed from the parent
          }
        }}
      />

      {/* Render AdjustStock Dialog */}
      <AdjustStock
        isOpen={isAdjustStockDialogOpen}
        onOpenChange={setIsAdjustStockDialogOpen}
        part={selectedPartForAdjust}
        onStockAdjusted={() => {
          if (onRefresh) {
            onRefresh(); // Call the refresh function passed from the parent
          }
        }}
      />
    </>
  );
};

export default DataTable;