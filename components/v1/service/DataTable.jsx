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
import pb from '@/services/pocketbase'
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ViewServiceDialog from './ViewServiceDialog'

const DataTable = ({ searchQuery = "", refreshTrigger = 0, scheduledOnly = false }) => {
  // State for service request data
  const [serviceData, setServiceData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  // Add localRefreshTrigger to manage internal refreshes
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0)

  // State for user roles
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTechnician, setIsTechnician] = useState(false);

  // State for viewing service dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedServiceForView, setSelectedServiceForView] = useState(null)

  // State for date picker
  const [date, setDate] = useState(null)
  const [selectedServiceForSchedule, setSelectedServiceForSchedule] = useState(null)
  const [isScheduling, setIsScheduling] = useState(false)

  // State for status update
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // State for technician assignment
  const [isAssigningTechnician, setIsAssigningTechnician] = useState(false)

  // State for technicians data
  const [technicians, setTechnicians] = useState([])
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false)

  // Function to handle refresh
  const handleRefresh = () => {
    setLocalRefreshTrigger(prev => prev + 1);
  };

  // Check auth state on component mount
  useEffect(() => {
    try {
      // Check if pb is defined before accessing authStore
      if (!pb) {
        console.error("PocketBase instance is undefined");
        setIsLoading(false); // Stop loading if pb is unavailable
        return;
      }

      const isAuthenticated = pb.authStore?.isValid;
      const currentUser = pb.authStore?.model;

      console.log('Auth state check:', {
        isAuthenticated,
        userRole: currentUser?.role,
      });

      if (isAuthenticated && currentUser) {
        setUserRole(currentUser.role);
        setIsAdmin(currentUser.role === 'admin');
        setIsTechnician(currentUser.role === 'technician');
      } else {
        // Set defaults when not authenticated
        setUserRole(null);
        setIsAdmin(false);
        setIsTechnician(false);
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
      // Ensure we exit loading state even if there's an error
      setIsLoading(false);
    }

    // Set up listener for auth changes
    let unsubscribe = null;
    try {
      if (pb && typeof pb.authStore?.onChange === 'function') {
        unsubscribe = pb.authStore.onChange(() => {
          try {
            const isAuthenticated = pb.authStore?.isValid;
            const currentUser = pb.authStore?.model;

            if (isAuthenticated && currentUser) {
              setUserRole(currentUser.role);
              setIsAdmin(currentUser.role === 'admin');
              setIsTechnician(currentUser.role === 'technician');
            } else {
              setUserRole(null);
              setIsAdmin(false);
              setIsTechnician(false);
            }
          } catch (error) {
            console.error("Error in auth change handler:", error);
          }
        });
      }
    } catch (err) {
      console.error("Error setting up auth listener:", err);
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Fetch technicians data
  useEffect(() => {
    // Only fetch technicians if user is admin (technicians don't need this data)
    if (isAdmin) {
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
    }
  }, [isAdmin]);

  // Fetch service request data from pocketbase
  useEffect(() => {
    const fetchServiceRequests = async () => {
      setIsLoading(true);
      try {
        // Check if pb is defined
        if (!pb) {
          throw new Error("PocketBase instance is unavailable");
        }

        const currentUser = pb.authStore?.model;

        // Create a filter based on search query (if provided)
        let filter = '';

        // For technicians, only show services assigned to them
        if (isTechnician && currentUser?.id) {
          filter = `assigned_technician = "${currentUser.id}"`;
        }

        // Add search filter if provided
        if (searchQuery) {
          const searchFilter = `problem~"${searchQuery}" || product~"${searchQuery}"`;
          filter = filter ? `(${filter}) && (${searchFilter})` : searchFilter;
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

        console.log('Fetching service requests with filter:', filter);

        // Fetch service requests with expand for user and technician relations
        const resultList = await pb.collection('service_request').getList(1, 50, {
          filter: filter,
          sort: sort,
          expand: 'user,assigned_technician',
          requestKey: null,
        });

        console.log('Service requests fetched:', resultList.items.length);

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
          rawScheduledDate: request.scheduled_date ? request.scheduled_date : null, // Keep raw date for editing
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
        setError(err.message || "Failed to load service requests");
        // Set empty data to avoid undefined errors
        setServiceData([]);
      } finally {
        // Always exit loading state, even on error
        setIsLoading(false);
      }
    };

    // Call the fetch function immediately or set a timeout for debugging
    fetchServiceRequests();

  }, [searchQuery, refreshTrigger, scheduledOnly, localRefreshTrigger, isTechnician]);

  // Handle viewing service request details
  const handleViewService = (service) => {
    setSelectedServiceForView(service);
    setIsViewDialogOpen(true);
  };

  // Handle scheduling service - initialize date picker for a service
  const handleScheduleService = (service) => {
    if (!isAdmin) {
      toast.error("Only admin users can schedule services");
      return;
    }

    if (!service.technicianId) {
      toast.error("Cannot schedule a service without an assigned technician");
      return;
    }

    setSelectedServiceForSchedule(service);
    // Initialize with current scheduled date if any
    setDate(service.rawScheduledDate ? new Date(service.rawScheduledDate) : null);
  };

  // Handle date change in the calendar
  const handleDateChange = async (newDate) => {
    if (!selectedServiceForSchedule) return;

    setIsScheduling(true);
    try {
      // Format date for PocketBase
      const formattedDate = newDate ? format(newDate, "yyyy-MM-dd") : null;

      // Update the service request in PocketBase
      await pb.collection('service_request').update(selectedServiceForSchedule.id, {
        scheduled_date: formattedDate,
        status: "scheduled" // Update status to scheduled when a date is set
      });

      toast.success("Service scheduled successfully");
      handleRefresh(); // Refresh the table data
    } catch (err) {
      console.error('Error scheduling service:', err);
      toast.error(`Failed to schedule service: ${err.message}`);
    } finally {
      setIsScheduling(false);
      setSelectedServiceForSchedule(null); // Close the popover
    }
  };

  // Handle status change in dropdown
  const handleStatusChange = async (serviceId, newStatus) => {
    if (!isAdmin && !isTechnician) {
      toast.error("Only admin or technician users can change service status");
      return;
    }

    // Get the current service to check its status
    const currentService = serviceData.find(service => service.id === serviceId);

    // Prevent changing status from "scheduled" to anything except "completed"
    if (currentService?.status === "scheduled" && newStatus !== "completed") {
      toast.error("Scheduled services can only be marked as completed");
      return;
    }

    // Prevent changing status from "completed"
    if (currentService?.status === "completed") {
      toast.error("Completed services cannot be modified");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await pb.collection('service_request').update(serviceId, {
        status: newStatus
      });

      toast.success(`Service status updated to ${newStatus}`);
      handleRefresh(); // Refresh the table data
    } catch (err) {
      console.error('Error updating service status:', err);
      toast.error(`Failed to update status: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle technician assignment change
  const handleTechnicianChange = async (serviceId, technicianId) => {
    if (!isAdmin) {
      toast.error("Only admin users can assign technicians");
      return;
    }

    setIsAssigningTechnician(true);
    try {
      await pb.collection('service_request').update(serviceId, {
        assigned_technician: technicianId === "unassigned" ? null : technicianId
      });

      const technicianName = technicianId && technicianId !== "unassigned"
        ? technicians.find(tech => tech.id === technicianId)?.name || 'Selected technician'
        : 'None';

      toast.success(`Assigned to ${technicianName}`);
      handleRefresh(); // Refresh the table data
    } catch (err) {
      console.error('Error assigning technician:', err);
      toast.error(`Failed to assign technician: ${err.message}`);
    } finally {
      setIsAssigningTechnician(false);
    }
  };

  // Handle deleting service request
  const handleDeleteService = async (service) => {
    if (!isAdmin) {
      toast.error("Only admin users can delete service requests");
      return;
    }

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

    // Status column with dropdown for admin and technician (technicians can update status of their assigned tasks)
    {
      accessorKey: "status",
      header: () => <div className="text-center font-medium">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue("status");

        // Get style based on status
        const getStatusClass = (status) => {
          switch (status) {
            case "pending":
              return "bg-amber-100 text-amber-800";
            case "scheduled":
              return "bg-purple-100 text-purple-800";
            case "completed":
              return "bg-green-100 text-green-800";
            default:
              return "bg-gray-100 text-gray-800";
          }
        };

        // Format status for display
        const formatStatus = (status) => {
          if (!status) return "unknown";
          return status;
        };

        // If admin user or technician, show dropdown for status change (but restrict based on status)
        if (isAdmin || isTechnician) {
          // If status is "scheduled", it cannot be modified - only show Complete button for technicians
          if (status === "scheduled") {
            return (
              <div className="text-center flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(status)}`}>
                  {formatStatus(status)}
                </span>
                {isTechnician && (
                  <Button
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(row.original.id, "completed")}
                    className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                  >
                    Complete
                  </Button>
                )}
              </div>
            );
          }

          // For other statuses, show dropdown but limit options
          return (
            <div className="text-center">
              <Select
                disabled={isUpdatingStatus || status === "completed"}
                value={status}
                onValueChange={(value) => handleStatusChange(row.original.id, value)}
              >
                <SelectTrigger className={`h-8 w-full px-2 ${getStatusClass(status)} border-none`}>
                  <SelectValue>{formatStatus(status)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        }

        // For other users, show status badge only
        return (
          <div className="text-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(status)}`}>
              {formatStatus(status)}
            </span>
          </div>
        );
      },
      size: 120,
    },

    // Assigned Technician column with dropdown for admin only
    {
      accessorKey: "assignedTechnician",
      header: () => <div className="text-left font-medium">Technician</div>,
      cell: ({ row }) => {
        // If admin user and technicians loaded, show dropdown for technician assignment
        if (isAdmin && technicians.length > 0) {
          return (
            <div className="text-left">
              <Select
                disabled={isAssigningTechnician || isLoadingTechnicians}
                value={row.original.technicianId || "unassigned"}
                onValueChange={(value) => handleTechnicianChange(row.original.id, value)}
              >
                <SelectTrigger className="h-8 w-full text-left">
                  <SelectValue placeholder="Unassigned">
                    {row.getValue("assignedTechnician")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        // For technicians or while loading, show text only
        return (
          <div className="text-left">
            {isLoadingTechnicians ? "Loading..." : row.getValue("assignedTechnician")}
          </div>
        );
      },
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
          {/* View button - available to all users */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleViewService(row.original)}
          >
            <Icon icon="mdi:eye-outline" width={16} />
          </Button>

          {/* Schedule button - only for admin */}
          {isAdmin && (
            <Popover
              open={selectedServiceForSchedule?.id === row.original.id}
              onOpenChange={(open) => {
                if (!open) setSelectedServiceForSchedule(null);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => handleScheduleService(row.original)}
                  title="Schedule Service"
                  disabled={!row.original.technicianId || isScheduling}
                >
                  <Icon icon="mdi:calendar-outline" width={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateChange}
                  disabled={isScheduling}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Delete button - only for admin */}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDeleteService(row.original)}
            >
              <Icon icon="mdi:trash-can-outline" width={16} />
            </Button>
          )}
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

  // Handle auth error
  if (!pb.authStore.isValid) {
    return (
      <div className="flex justify-center items-center h-64 flex-col">
        <div className="text-amber-600 mb-2">Not authenticated</div>
        <p className="text-sm text-gray-500">Please log in to view service requests</p>
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
                    <TableCell key={header.id} className="text-left">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            {/* Table Body */}
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {isViewDialogOpen && selectedServiceForView && (
        <ViewServiceDialog
          isOpen={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          service={selectedServiceForView}
          onServiceUpdate={handleRefresh}
        />
      )}
    </>
  );
};

export default DataTable;