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
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table'
import pb from '@/services/pocketbase'
import { toast } from "sonner"
import ViewServiceHistoryDialog from './ViewServiceHistoryDialog'

const DataTable = ({ searchQuery = "", refreshTrigger = 0, userRole }) => {
  // State for service history data
  const [serviceData, setServiceData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // State for viewing service history dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedServiceForView, setSelectedServiceForView] = useState(null)

  // Fetch completed service requests
  const fetchServiceHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const records = await pb.collection('service_request').getFullList({
        filter: 'status = "completed"',
        sort: '-updated', // Sort by updated date since completed_date may not exist
        expand: 'user,assigned_technician'
      });

      console.log('Fetched service history:', records);

      // Format the data for display
      const formattedData = records.map(record => ({
        id: record.id,
        user: record.expand?.user?.name || 'Unknown User',
        product: record.product || 'Unknown Product',
        technician: record.expand?.assigned_technician?.name || 'Unassigned',
        problemDescription: record.problem || 'No description',
        diagnosisNotes: record.diagnosis_notes || 'No diagnosis notes',
        completedDate: record.completed_date ? new Date(record.completed_date).toLocaleDateString() :
                      (record.updated ? new Date(record.updated).toLocaleDateString() : 'Unknown'),
        createdDate: record.created ? new Date(record.created).toLocaleDateString() : 'Unknown',
        requestedDate: record.requested_date ? new Date(record.requested_date).toLocaleDateString() : 'Not specified',
        scheduledDate: record.scheduled_date ? new Date(record.scheduled_date).toLocaleDateString() : 'Not scheduled',
        diagnosedParts: (() => {
          try {
            return record.diagnosed_parts ? JSON.parse(record.diagnosed_parts) : [];
          } catch (e) {
            console.error('Error parsing diagnosed_parts:', e);
            return [];
          }
        })(),
        status: record.status,
        remarks: record.remarks || '',
        hasAttachment: !!record.attachment,
        // Include all original data for the dialog
        originalRecord: {
          ...record,
          collectionId: record.collectionId || 'pbc_2589929617'
        }
      }));

      setServiceData(formattedData);
    } catch (error) {
      console.error('Error fetching service history:', error);
      setError('Failed to load service history');
      toast.error('Failed to load service history');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when refresh is triggered
  useEffect(() => {
    fetchServiceHistory();
  }, [refreshTrigger]);

  // Handle viewing service history
  const handleViewService = (service) => {
    setSelectedServiceForView(service);
    setIsViewDialogOpen(true);
  };

  // Filter data based on search query
  const filteredData = serviceData.filter(service => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      service.user.toLowerCase().includes(searchLower) ||
      service.product.toLowerCase().includes(searchLower) ||
      service.technician.toLowerCase().includes(searchLower) ||
      service.problemDescription.toLowerCase().includes(searchLower) ||
      service.id.toLowerCase().includes(searchLower)
    );
  });

  // Define column configuration
  const columns = [
    // Service ID column
    {
      accessorKey: "id",
      header: () => <div className="text-left font-medium">Service ID</div>,
      cell: ({ row }) => (
        <div className="text-left font-mono text-xs">{row.getValue("id").slice(-8)}</div>
      ),
      size: 100,
    },

    // Customer column
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

    // Technician column
    {
      accessorKey: "technician",
      header: () => <div className="text-left font-medium">Technician</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("technician")}</div>
      ),
    },

    // Completed Date column
    {
      accessorKey: "completedDate",
      header: () => <div className="text-center font-medium">Completed Date</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("completedDate")}</div>
      ),
      size: 120,
    },

    // Problem Description column (truncated)
    {
      accessorKey: "problemDescription",
      header: () => <div className="text-left font-medium">Problem</div>,
      cell: ({ row }) => {
        const description = row.getValue("problemDescription");
        const truncated = description.length > 50 ? description.substring(0, 50) + "..." : description;
        return <div className="text-left text-sm">{truncated}</div>;
      },
    },

    // Status column
    {
      accessorKey: "status",
      header: () => <div className="text-center font-medium">Status</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Icon icon="mdi:check-circle" className="h-3 w-3 mr-1" />
            Completed
          </span>
        </div>
      ),
      size: 100,
    },

    // Actions column
    {
      id: "actions",
      header: () => <div className="text-right font-medium">Actions</div>,
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleViewService(row.original)}
            title="View service details"
          >
            <Icon icon="mdi:eye" className="h-4 w-4" />
          </Button>
        </div>
      ),
      size: 80,
    },
  ];

  // Create table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg">
        <div className="flex items-center gap-2 text-gray-600">
          <Icon icon="mdi:loading" className="h-6 w-6 animate-spin" />
          Loading service history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg">
        <div className="text-center text-red-600">
          <Icon icon="mdi:alert-circle" className="h-12 w-12 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Table */}
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="font-semibold text-gray-700"
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Icon icon="mdi:history" className="h-12 w-12 text-gray-300" />
                    <div>
                      <p className="font-medium">No completed services found</p>
                      <p className="text-sm">Completed service requests will appear here</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between space-x-2 py-4 px-4 border-t">
          <div className="text-sm text-gray-600">
            Showing {table.getRowModel().rows.length} of {filteredData.length} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View Service History Dialog */}
      <ViewServiceHistoryDialog
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        service={selectedServiceForView}
      />
    </div>
  );
};

export default DataTable;