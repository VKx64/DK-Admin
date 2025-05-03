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
import Image from 'next/image';
import { Icon } from "@iconify/react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
} from '@tanstack/react-table';
import ViewTechnician from './ViewTechnician';
import EditTechnician from './EditTechnician';

/**
 * TechnicianTable - Table for displaying technician data with consistent styling
 */
const TechnicianTable = ({ technicians = [], isLoading = false, onDataChanged }) => {
  // State for ViewTechnician dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTechnicianForView, setSelectedTechnicianForView] = useState(null);

  // State for EditTechnician dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTechnicianForEdit, setSelectedTechnicianForEdit] = useState(null);

  // Define column configuration with consistent styling
  const columns = [
    // Profile image column
    {
      id: "image",
      header: () => <div className="text-center font-medium">Profile</div>,
      cell: ({ row }) => {
        // Avatar is stored in the users table, not in technician_details
        const avatarImage = row.original.avatar;
        const imageUrl = avatarImage
          ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${row.original.id}/${avatarImage}`
          : "/Images/default_user.jpg";

        return (
          <div className="flex justify-center items-center">
            <div className="h-10 w-10 relative rounded-full overflow-hidden border border-gray-950/20">
              <Image
                src={imageUrl}
                alt={row.original.name || "Technician image"}
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
        <div className="text-left font-medium">
          {row.getValue("name") || "Unnamed Technician"}
        </div>
      ),
      size: 180,
    },

    // Email column
    {
      accessorKey: "email",
      header: () => <div className="text-left font-medium">Email</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("email") || "-"}</div>
      ),
      size: 180,
    },

    // Preferred Job Type column
    {
      id: "preferred_job_type",
      header: () => <div className="text-left font-medium">Preferred Job</div>,
      cell: ({ row }) => {
        const techDetails = row.original.expand?.technician_details;
        return (
          <div className="text-left">
            {techDetails?.preferred_job_type || "-"}
          </div>
        );
      },
      size: 120,
    },

    // Specialization column
    {
      id: "specialization",
      header: () => <div className="text-left font-medium">Specialization</div>,
      cell: ({ row }) => {
        const techDetails = row.original.expand?.technician_details;
        return (
          <div className="text-left">
            {techDetails?.specialization || "-"}
          </div>
        );
      },
      size: 150,
    },

    // Years of Experience column
    {
      id: "years_of_experience",
      header: () => <div className="text-right font-medium">Experience</div>,
      cell: ({ row }) => {
        const experience = row.original.expand?.technician_details?.years_of_experience;
        return (
          <div className="text-right">
            {experience ? `${experience} years` : "-"}
          </div>
        );
      },
      size: 100,
    },

    // Actions column with Iconify icons (view, edit, delete)
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
            onClick={() => handleViewTechnician(row.original)}
          >
            <Icon icon="mdi:eye-outline" width={16} />
          </Button>

          {/* Edit button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleEditTechnician(row.original)}
          >
            <Icon icon="mdi:pencil-outline" width={16} />
          </Button>

          {/* Delete button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => {}}
          >
            <Icon icon="mdi:trash-can-outline" width={16} />
          </Button>
        </div>
      ),
      size: 120,
    },
  ];

  // Create table instance with TanStack Table
  const table = useReactTable({
    data: technicians || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Handler functions for actions
  const handleViewTechnician = (technician) => {
    setSelectedTechnicianForView(technician); // Set the selected technician
    setIsViewDialogOpen(true); // Open the dialog
  };

  // Handle editing technician details
  const handleEditTechnician = (technician) => {
    setSelectedTechnicianForEdit(technician); // Set the selected technician for editing
    setIsEditDialogOpen(true); // Open the edit dialog
  };

  // Handle successful technician update
  const handleTechnicianUpdated = () => {
    // Call parent component's data change handler if provided
    if (onDataChanged) {
      onDataChanged();
    }
  };

  // Show loading state if loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render table with technician data
  return (
    <>
      <div className="rounded-md border bg-white">
        <div className="overflow-auto">
          <Table>
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

      {/* View Technician Dialog */}
      <ViewTechnician
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        technician={selectedTechnicianForView}
      />

      {/* Edit Technician Dialog */}
      <EditTechnician
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        technician={selectedTechnicianForEdit}
        onSuccess={handleTechnicianUpdated}
      />
    </>
  );
};

export default TechnicianTable;