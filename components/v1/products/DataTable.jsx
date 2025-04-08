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
import { Edit, Trash2 } from 'lucide-react'
import Image from 'next/image'
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

// Define column configuration outside the component
const getColumns = () => [
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

  // Product image column
  {
    id: "image",
    header: () => <div className="text-center font-medium">Image</div>,
    cell: ({ row }) => (
      <div className="flex justify-center items-center">
        <div className="h-10 w-10 relative rounded-md overflow-hidden">
          <Image
            src={row.original.image}
            alt={row.original.name}
            fill
            className="object-cover"
          />
        </div>
      </div>
    ),
    enableSorting: false,
    size: 60,
  },

  // Product name column
  {
    accessorKey: "name",
    header: () => <div className="text-left font-medium">Product Name</div>,
    cell: ({ row }) => (
      <div className="text-left font-medium">{row.getValue("name")}</div>
    ),
  },

  // Category column
  {
    accessorKey: "category",
    header: () => <div className="text-left font-medium">Category</div>,
    cell: ({ row }) => (
      <div className="text-left">{row.getValue("category")}</div>
    ),
    size: 120,
  },

  // Stock column
  {
    accessorKey: "stock",
    header: () => <div className="text-center font-medium">Stock</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("stock")}</div>
    ),
    size: 70,
  },

  // Price column
  {
    accessorKey: "price",
    header: () => <div className="text-right font-medium">Price</div>,
    cell: ({ row }) => {
      // Format the price as currency (e.g., $299.99)
      const amount = parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
    size: 100,
  },

  // Discount column
  {
    accessorKey: "discount",
    header: () => <div className="text-center font-medium">Discount</div>,
    cell: ({ row }) => {
      const discountValue = row.getValue("discount");
      return (
        <div className={`text-center ${discountValue > 0 ? "text-green-600 font-medium" : "text-gray-500"}`}>
          {discountValue > 0 ? `${discountValue}%` : "—"}
        </div>
      );
    },
    size: 80,
  },

  // Actions column (edit, delete buttons)
  {
    id: "actions",
    header: () => <div className="text-right font-medium">Actions</div>,
    cell: ({ row }) => (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
    size: 80,
  },
];

/**
 * DataTable - A reusable table component for displaying and managing data
 *
 * @param {Object} props
 * @param {Array} props.data - Array of data objects to display in the table
 * @param {Object} props.rowSelection - Currently selected rows
 * @param {Function} props.setRowSelection - Function to update row selection state
 * @param {Function} props.onTableReady - Function called with the table instance after creation
 */
const DataTable = ({ data, rowSelection, setRowSelection, onTableReady }) => {
  const columns = getColumns();

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
        pageSize: 15, // Show 5 products per page
      },
    },
  });

  // Give parent access to the table instance
  React.useEffect(() => {
    if (onTableReady) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

  return (
    <>
      {/* Product Table Container */}
      <div className="rounded-md border overflow-hidden flex-1 flex flex-col">
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
                    No products found.
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