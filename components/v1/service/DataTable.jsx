"use client";
import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Icon } from "@iconify/react"
import Image from 'next/image'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
} from '@tanstack/react-table'
import { pb } from '@/lib/pocketbase'
import { toast } from "sonner"

const DataTable = ({ searchQuery = "", refreshTrigger = 0, scheduledOnly = false }) => {
  // State for service request data
  const [serviceData, setServiceData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  // Add localRefreshTrigger to manage internal refreshes
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0)

  // State for viewing, scheduling and editing dialogs
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedServiceForView, setSelectedServiceForView] = useState(null)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [selectedServiceForSchedule, setSelectedServiceForSchedule] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState(null)

  // State for technicians data
  const [technicians, setTechnicians] = useState([])
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false)

  // Function to handle refresh
  const handleRefresh = () => {
    setLocalRefreshTrigger(prev => prev + 1);
  };

  // Fetch technicians data
  useEffect(() => {
    const fetchTechnicians = async () => {
      setIsLoadingTechnicians(true);
      try {
        // Fetch users with role "technician"
        const result = await pb.collection('users').getList(1, 100, {
          filter: 'role = "technician"',
          sort: 'name',
          requestKey: null,
        });

        setTechnicians(result.items);
      } catch (err) {
        console.error('Error fetching technicians:', err);
      } finally {
        setIsLoadingTechnicians(false);
      }
    };

    fetchTechnicians();
  }, []);

  // Fetch service request data from pocketbase
  useEffect(() => {
    const fetchServiceRequests = async () => {
      setIsLoading(true);
      try {
        // Create a filter based on search query (if provided)
        let filter = '';

        if (searchQuery) {
          filter = `problem~"${searchQuery}" || product~"${searchQuery}"`;
        }

        // Add scheduled filter if enabled
        if (scheduledOnly) {
          const scheduledFilter = 'scheduled_date != "" && status = "scheduled"';
          filter = filter ? `(${filter}) && ${scheduledFilter}` : scheduledFilter;
        }

        // Set sort parameters
        let sort = '-created';

        if (scheduledOnly) {
          // When showing scheduled services, sort by scheduled date
          sort = '+scheduled_date';
        }

        // Fetch service requests with expand for user and technician relations
        const resultList = await pb.collection('service_request').getList(1, 50, {
          filter: filter,
          sort: sort,
          expand: 'user,assigned_technician',
          requestKey: null,
        });

        // Transform data for the table
        const transformedData = resultList.items.map(request => ({
          id: request.id,
          user: request.expand?.user?.name || 'Unknown User',
          userId: request.user,
          product: request.product,
          problem: request.problem,
          status: request.status,
          requestedDate: request.requested_date ? new Date(request.requested_date).toLocaleDateString() : 'Not specified',
          scheduledDate: request.scheduled_date ? new Date(request.scheduled_date).toLocaleDateString() : null,
          createdDate: new Date(request.created).toLocaleDateString(),
          hasAttachment: !!request.attachment,
          attachmentUrl: request.attachment
            ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${request.collectionId}/${request.id}/${request.attachment}`
            : null,
          assignedTechnician: request.expand?.assigned_technician?.name || 'Unassigned',
          technicianId: request.assigned_technician || '',
          remarks: request.remarks || '',
          collectionId: request.collectionId,
          created: request.created,
          updated: request.updated,
        }));

        setServiceData(transformedData);
      } catch (err) {
        console.error('Error fetching service requests:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceRequests();
  }, [searchQuery, refreshTrigger, scheduledOnly, localRefreshTrigger]);

  // Handle viewing service request details
  const handleViewService = (service) => {
    setSelectedServiceForView(service);
    setIsViewDialogOpen(true);
  };

  // Handle scheduling service
  const handleScheduleService = (service) => {
    setSelectedServiceForSchedule(service);
    setIsScheduleDialogOpen(true);
  };

  // Handle editing service request
  const handleEditService = (service) => {
    setSelectedServiceForEdit(service);
    setIsEditDialogOpen(true);
  };

  // Handle deleting service request
  const handleDeleteService = async (service) => {
    if (window.confirm('Are you sure you want to delete this service request?')) {
      try {
        await pb.collection('service_request').delete(service.id);
        toast.success('Service request deleted successfully');
        handleRefresh();
      } catch (err) {
        console.error('Error deleting service request:', err);
        toast.error(`Failed to delete service request: ${err.message}`);
      }
    }
  };

  // Define column configuration for service request data
  const columns = [
    // User column
    {
      accessorKey: "user",
      header: () => <div className="text-left font-medium">Customer</div>,
      cell: ({ row }) => (
        <div className="text-left font-medium">{row.getValue("user")}</div>
      ),
      size: 150,
    },

    // Product column
    {
      accessorKey: "product",
      header: () => <div className="text-left font-medium">Product</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("product")}</div>
      ),
      size: 150,
    },

    // Problem description column (truncated with ellipsis)
    {
      accessorKey: "problem",
      header: () => <div className="text-left font-medium">Problem</div>,
      cell: ({ row }) => {
        const problem = row.getValue("problem");
        const truncated = problem?.length > 50 ? `${problem.substring(0, 50)}...` : problem;
        return <div className="text-left max-w-[200px] truncate" title={problem}>{truncated || "No description"}</div>;
      },
      size: 200,
    },

    // Status column with color-coding
    {
      accessorKey: "status",
      header: () => <div className="text-center font-medium">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue("status");
        let statusClass = "bg-gray-100 text-gray-800"; // Default style
        let formattedStatus = status || "unknown";

        switch (status) {
          case "pending":
            statusClass = "bg-amber-100 text-amber-800";
            break;
          case "in_progress":
            statusClass = "bg-blue-100 text-blue-800";
            formattedStatus = "in progress";
            break;
          case "scheduled":
            statusClass = "bg-purple-100 text-purple-800";
            break;
          case "completed":
            statusClass = "bg-green-100 text-green-800";
            break;
        }

        return (
          <div className="text-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
              {formattedStatus}
            </span>
          </div>
        );
      },
      size: 100,
    },

    // Assigned Technician column
    {
      accessorKey: "assignedTechnician",
      header: () => <div className="text-left font-medium">Technician</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("assignedTechnician")}</div>
      ),
      size: 120,
    },

    // Scheduled Date column
    {
      accessorKey: "scheduledDate",
      header: () => <div className="text-center font-medium">Scheduled</div>,
      cell: ({ row }) => {
        const scheduledDate = row.getValue("scheduledDate");
        return (
          <div className="text-center">
            {scheduledDate || "-"}
          </div>
        );
      },
      size: 100,
    },

    // Created date column
    {
      accessorKey: "createdDate",
      header: () => <div className="text-center font-medium">Created</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("createdDate")}</div>
      ),
      size: 100,
    },

    // Actions column with iconify icons
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
            onClick={() => handleViewService(row.original)}
          >
            <Icon icon="mdi:eye-outline" width={16} />
          </Button>

          {/* Edit button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleEditService(row.original)}
          >
            <Icon icon="mdi:pencil-outline" width={16} />
          </Button>

          {/* Schedule button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => handleScheduleService(row.original)}
            title="Schedule Service"
            disabled={!row.original.technicianId}
          >
            <Icon icon="mdi:calendar-outline" width={16} />
          </Button>

          {/* Delete button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDeleteService(row.original)}
          >
            <Icon icon="mdi:trash-can-outline" width={16} />
          </Button>
        </div>
      ),
      size: 150,
    }
  ];

  // Create table instance with TanStack Table
  const table = useReactTable({
    data: serviceData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
                    No service requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ViewService Dialog Placeholder */}
      {isViewDialogOpen && selectedServiceForView && (
        <div>
          {/* This would be replaced with an imported component like ViewService */}
          {/* Similar to how the Parts component uses separate components */}
        </div>
      )}

      {/* EditService Dialog Placeholder */}
      {isEditDialogOpen && selectedServiceForEdit && (
        <div>
          {/* This would be replaced with an imported component like EditService */}
        </div>
      )}

      {/* ScheduleService Dialog Placeholder */}
      {isScheduleDialogOpen && selectedServiceForSchedule && (
        <div>
          {/* This would be replaced with an imported component like ScheduleService */}
        </div>
      )}
    </>
  );
};

export default DataTable;