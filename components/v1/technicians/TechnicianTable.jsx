"use client";
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import ViewTechnician from './ViewTechnician';
import EditTechnician from './EditTechnician';

/**
 * TechnicianTable - Simple table for displaying technician data
 */
const TechnicianTable = ({ technicians = [], isLoading = false, onDataChanged }) => {
  // State for the view technician dialog
  const [viewDialog, setViewDialog] = useState({
    isOpen: false,
    technician: null,
  });

  // State for the edit technician dialog
  const [editDialog, setEditDialog] = useState({
    isOpen: false,
    technician: null,
  });

  // Define column configuration with only the requested columns
  const columns = [
    // Name column
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => row.getValue("name") || "Unnamed Technician",
    },

    // Email column
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.getValue("email"),
    },

    // Preferred Job Type column
    {
      id: "preferred_job_type",
      header: "Preferred Job",
      cell: ({ row }) => {
        const techDetails = row.original.expand?.technician_details;
        return techDetails?.preferred_job_type || "—";
      },
    },

    // Specialization column
    {
      id: "specialization",
      header: "Specialization",
      cell: ({ row }) => {
        const techDetails = row.original.expand?.technician_details;
        return techDetails?.specialization || "—";
      },
    },
    
    // Years of Experience column
    {
      id: "years_of_experience",
      header: "Experience",
      cell: ({ row }) => {
        const experience = row.original.expand?.technician_details?.years_of_experience;
        return experience ? `${experience} years` : "—";
      },
    },
    
    // Actions column
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
            onClick={() => handleViewTechnician(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-green-100 hover:text-green-600"
            onClick={() => handleEditTechnician(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
            onClick={() => {}}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Handle viewing technician details
  const handleViewTechnician = (technician) => {
    setViewDialog({
      isOpen: true,
      technician: technician,
    });
  };

  // Handle editing technician details
  const handleEditTechnician = (technician) => {
    setEditDialog({
      isOpen: true,
      technician: technician,
    });
  };

  // Handle successful technician update
  const handleTechnicianUpdated = () => {
    // Call parent component's data change handler if provided
    if (onDataChanged) {
      onDataChanged();
    }
  };

  // Create table instance
  const table = useReactTable({
    data: technicians,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Show loading state if loading
  if (isLoading) {
    return (
      <div className="bg-white p-8 text-center rounded-md border flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full mb-4"></div>
          <p className="text-gray-600">Loading technicians...</p>
        </div>
      </div>
    );
  }

  // Render table with technician data
  return (
    <>
      <div className="flex flex-col gap-4 flex-1">
        <div className="rounded-md border overflow-hidden flex-1 flex flex-col bg-white">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="px-4 py-3 bg-gray-50 font-medium text-left"
                      >
                        {header.isPlaceholder ? null : flexRender(
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
                  // Map through rows if we have data
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-3">
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

        <div className="text-sm text-gray-500 pl-2">
          {technicians.length} technician{technicians.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* View Technician Dialog */}
      <ViewTechnician 
        open={viewDialog.isOpen}
        onOpenChange={(open) => setViewDialog((prev) => ({ ...prev, isOpen: open }))}
        technician={viewDialog.technician}
      />

      {/* Edit Technician Dialog */}
      <EditTechnician
        open={editDialog.isOpen}
        onOpenChange={(open) => setEditDialog((prev) => ({ ...prev, isOpen: open }))}
        technician={editDialog.technician}
        onSuccess={handleTechnicianUpdated}
      />
    </>
  );
};

export default TechnicianTable;