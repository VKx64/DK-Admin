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
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Eye, RefreshCw, Save } from 'lucide-react'
import Image from 'next/image'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { pb } from '@/lib/pocketbase'
import { toast } from "sonner";

// Table Component with integrated data fetching
const DataTable = ({ searchQuery = "", refreshTrigger = 0 }) => {
  // State for service request data
  const [serviceData, setServiceData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // State for pagination
  const [page, setPage] = useState(1)
  const [perPage] = useState(15)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)

  // State for filtering and sorting
  const [statusFilter, setStatusFilter] = useState("")
  const [dateSort, setDateSort] = useState("")

  // State for row selection
  const [rowSelection, setRowSelection] = useState({})

  // State for service request detail dialog
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  // State for technician data
  const [technicians, setTechnicians] = useState([])
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false)
  const [isAssigningTechnician, setIsAssigningTechnician] = useState(false)

  // State to track assigned technicians for each service request
  const [technicianAssignments, setTechnicianAssignments] = useState({})

  // Fetch technicians data
  useEffect(() => {
    const fetchTechnicians = async () => {
      setIsLoadingTechnicians(true);
      try {
        // Fetch users with role "technician"
        const result = await pb.collection('users').getList(1, 100, {
          filter: 'role = "technician"',
          sort: 'name',
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

        // Add status filter if selected
        if (statusFilter) {
          filter = filter ? `(${filter}) && status="${statusFilter}"` : `status="${statusFilter}"`;
        }

        // Set sort parameters
        let sort = '';
        if (dateSort === 'newest') {
          sort = '-created';
        } else if (dateSort === 'oldest') {
          sort = '+created';
        }

        // Fetch service requests with expand for user and technician relations
        const resultList = await pb.collection('service_request').getList(page, perPage, {
          filter: filter,
          sort: sort,
          expand: 'user,assigned_technician',
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
          createdDate: new Date(request.created).toLocaleDateString(),
          hasAttachment: !!request.attachment,
          attachmentUrl: request.attachment
            ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${request.collectionId}/${request.id}/${request.attachment}`
            : null,
          assignedTechnician: request.expand?.assigned_technician?.name || 'Unassigned',
          technicianId: request.assigned_technician || '',
          remarks: request.remarks || '',
          originalData: request, // Store the full original data for reference
        }));

        setServiceData(transformedData);

        // Initialize technician assignments with current values
        const assignments = {};
        transformedData.forEach(request => {
          assignments[request.id] = request.technicianId;
        });
        setTechnicianAssignments(assignments);

        setTotalPages(resultList.totalPages);
        setTotalItems(resultList.totalItems);
      } catch (err) {
        console.error('Error fetching service requests:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceRequests();
  }, [page, perPage, searchQuery, statusFilter, dateSort, refreshTrigger]);

  // Handle viewing service request details
  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setIsDetailDialogOpen(true);
  };

  // Handle technician assignment change
  const handleTechnicianChange = (serviceRequestId, technicianId) => {
    setTechnicianAssignments(prev => ({
      ...prev,
      [serviceRequestId]: technicianId
    }));
  };

  // Save technician assignment
  const handleSaveTechnicianAssignment = async (serviceRequestId, technicianId) => {
    setIsAssigningTechnician(true);
    try {
      // Update the service request with the new technician
      await pb.collection('service_request').update(serviceRequestId, {
        assigned_technician: technicianId || null,
      });

      // Update local state to reflect the change
      setServiceData(prev => prev.map(item => {
        if (item.id === serviceRequestId) {
          // Find the technician name to display
          const tech = technicians.find(t => t.id === technicianId);
          return {
            ...item,
            technicianId: technicianId || '',
            assignedTechnician: tech?.name || 'Unassigned',
          };
        }
        return item;
      }));

      toast.success("Technician assigned successfully");
    } catch (err) {
      console.error('Error assigning technician:', err);
      toast.error(`Failed to assign technician: ${err.message}`);
    } finally {
      setIsAssigningTechnician(false);
    }
  };

  // Define table columns
  const columns = [
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
      size: 40, // Column width in pixels
    },

    // Request ID column (shortened for display)
    {
      accessorKey: "id",
      header: () => <div className="text-left font-medium">ID</div>,
      cell: ({ row }) => (
        <div className="text-left font-medium">
          {`${row.getValue("id").substring(0, 8)}...`}
        </div>
      ),
      size: 80,
    },

    // Customer name column
    {
      accessorKey: "user",
      header: () => <div className="text-left font-medium">Customer</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("user")}</div>
      ),
    },

    // Product column
    {
      accessorKey: "product",
      header: () => <div className="text-left font-medium">Product</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("product")}</div>
      ),
    },

    // Problem description column (truncated with ellipsis)
    {
      accessorKey: "problem",
      header: () => <div className="text-left font-medium">Problem</div>,
      cell: ({ row }) => {
        const problem = row.getValue("problem");
        const truncated = problem?.length > 50 ? `${problem.substring(0, 50)}...` : problem;
        return <div className="text-left">{truncated || "No description"}</div>;
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

        switch (status) {
          case "pending":
            statusClass = "bg-amber-100 text-amber-800";
            break;
          case "in_progress":
            statusClass = "bg-blue-100 text-blue-800";
            break;
          case "scheduled":
            statusClass = "bg-purple-100 text-purple-800";
            break;
          case "completed":
            statusClass = "bg-green-100 text-green-800";
            break;
        }

        const formattedStatus = status?.replace("_", " ");

        return (
          <div className="text-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusClass}`}>
              {formattedStatus}
            </span>
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

    // Assigned Technician column with dropdown
    {
      id: "technician",
      header: () => <div className="text-left font-medium">Technician</div>,
      cell: ({ row }) => {
        const serviceRequestId = row.original.id;
        const currentAssignment = technicianAssignments[serviceRequestId];
        const hasChanged = currentAssignment !== row.original.technicianId;

        return (
          <div className="flex items-center gap-2">
            <Select
              value={currentAssignment}
              onValueChange={(value) => handleTechnicianChange(serviceRequestId, value)}
              disabled={isLoadingTechnicians || isAssigningTechnician}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Assign Technician" />
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

            {hasChanged && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleSaveTechnicianAssignment(serviceRequestId, currentAssignment)}
                disabled={isAssigningTechnician}
              >
                <Save className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
      size: 200,
    },

    // Actions column (view details button)
    {
      id: "actions",
      header: () => <div className="text-right font-medium">Actions</div>,
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleViewDetails(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
      size: 60,
    },
  ];

  // Create table instance with TanStack Table
  const table = useReactTable({
    data: serviceData,
    columns,
    enableRowSelection: true,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 15, // Show 15 rows per page
      },
    },
  });

  // Handle page navigation
  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  // Create formatted status options for filter
  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "scheduled", label: "Scheduled" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <>
      {/* Filters and Controls */}
      <div className="w-full bg-white rounded-sm shadow-sm p-4 flex flex-col gap-4 overflow-hidden">
        <div className="flex justify-between items-center">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="statusFilter" className="text-sm font-medium">
              Status:
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md text-sm px-3 py-1"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date sort */}
          <div className="flex items-center gap-2">
            <label htmlFor="dateSort" className="text-sm font-medium">
              Sort by date:
            </label>
            <select
              id="dateSort"
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value)}
              className="border border-gray-300 rounded-md text-sm px-3 py-1"
            >
              <option value="">Default</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-black/10" />

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex justify-center items-center py-10 text-red-500">
            Error: {error}
          </div>
        )}

        {/* Data Table */}
        {!isLoading && !error && (
          <div className="rounded-md border overflow-hidden flex-1 flex flex-col">
            {/* Table with scrollable body */}
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
                        No service requests found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 flex items-center justify-between border-t">
              {/* Selection counter */}
              <div className="flex-1 text-sm text-muted-foreground font-raleway">
                {Object.keys(rowSelection).length} of{" "}
                {totalItems} row(s) selected.
              </div>

              {/* Page navigation */}
              <div className="flex items-center space-x-6">
                {/* Page counter */}
                <span className="text-sm text-muted-foreground font-raleway">
                  Page {page} of {totalPages || 1}
                </span>

                {/* Pagination buttons */}
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Service Request Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Service Request Details</DialogTitle>
            <DialogDescription>
              Complete information about the service request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="grid gap-4 py-4">
              {/* Customer and Product Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-gray-500">Customer</h3>
                  <p className="text-lg">{selectedRequest.user}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-500">Product</h3>
                  <p className="text-lg">{selectedRequest.product}</p>
                </div>
              </div>

              {/* Status and Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-gray-500">Status</h3>
                  <p className="text-lg capitalize">
                    {selectedRequest.status?.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-500">Created Date</h3>
                  <p className="text-lg">{selectedRequest.createdDate}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-500">Requested Service Date</h3>
                  <p className="text-lg">{selectedRequest.requestedDate}</p>
                </div>
              </div>

              {/* Problem Description */}
              <div>
                <h3 className="font-medium text-sm text-gray-500">Problem Description</h3>
                <p className="text-lg whitespace-pre-wrap">{selectedRequest.problem}</p>
              </div>

              {/* Assigned Technician */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-gray-500">Assigned Technician</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Select
                      value={technicianAssignments[selectedRequest.id] || ''}
                      onValueChange={(value) => handleTechnicianChange(selectedRequest.id, value)}
                      disabled={isLoadingTechnicians || isAssigningTechnician}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Assign Technician" />
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveTechnicianAssignment(
                        selectedRequest.id,
                        technicianAssignments[selectedRequest.id]
                      )}
                      disabled={
                        isAssigningTechnician ||
                        technicianAssignments[selectedRequest.id] === selectedRequest.technicianId
                      }
                    >
                      {isAssigningTechnician ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {selectedRequest.remarks && (
                <div>
                  <h3 className="font-medium text-sm text-gray-500">Remarks</h3>
                  <p className="text-lg whitespace-pre-wrap">{selectedRequest.remarks}</p>
                </div>
              )}

              {/* Attachment if available */}
              {selectedRequest.hasAttachment && (
                <div>
                  <h3 className="font-medium text-sm text-gray-500">Attachment</h3>
                  <div className="mt-2">
                    {selectedRequest.attachmentUrl && (
                      <a
                        href={selectedRequest.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                          />
                        </svg>
                        View/Download Attachment
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DataTable;