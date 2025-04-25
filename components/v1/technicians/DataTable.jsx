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
import { FileText } from 'lucide-react'
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

/**
 * DataTable - A table component for displaying technician data
 *
 * @param {Object} props
 * @param {Array} props.data - Array of technician data objects to display in the table
 */
const DataTable = ({ data }) => {
  // Define column configuration
  const columns = [
    // Resume image column
    {
      id: "resume_image",
      header: () => <div className="text-center font-medium">Resume</div>,
      cell: ({ row }) => (
        <div className="flex justify-center items-center">
          {row.original.technician_details && row.original.technician_details.resume_image ? (
            <div className="h-10 w-10 relative rounded-md overflow-hidden">
              <Image
                src={row.original.technician_details.resume_image}
                alt="Resume"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
      ),
      enableSorting: false,
      size: 60,
    },

    // Name column
    {
      accessorKey: "name",
      header: () => <div className="text-left font-medium">Name</div>,
      cell: ({ row }) => (
        <div className="text-left font-medium">{row.getValue("name")}</div>
      ),
      size: 150,
    },

    // Email column
    {
      accessorKey: "email",
      header: () => <div className="text-left font-medium">Email</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("email")}</div>
      ),
      size: 180,
    },

    // Job Title column
    {
      accessorKey: "job_title",
      header: () => <div className="text-left font-medium">Job Title</div>,
      cell: ({ row }) => (
        <div className="text-left">
          {row.original.technician_details ? row.original.technician_details.job_title : "—"}
        </div>
      ),
      size: 150,
    },

    // Preferred Job Type column
    {
      accessorKey: "preferred_job_type",
      header: () => <div className="text-left font-medium">Preferred Job</div>,
      cell: ({ row }) => (
        <div className="text-left">
          {row.original.technician_details ? row.original.technician_details.preferred_job_type : "—"}
        </div>
      ),
      size: 150,
    },

    // Experience column
    {
      accessorKey: "years_of_experience",
      header: () => <div className="text-center font-medium">Experience</div>,
      cell: ({ row }) => {
        const experience = row.original.technician_details ? row.original.technician_details.years_of_experience : null;
        return (
          <div className="text-center">
            {experience ? `${experience} years` : "—"}
          </div>
        );
      },
      size: 100,
    },
  ];

  // Create table instance with TanStack Table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 15, // Show 15 technicians per page
      },
    },
  });

  return (
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
                  No technicians found.
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