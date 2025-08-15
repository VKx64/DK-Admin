"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import Image from "next/image";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useAuth } from "@/context/AuthContext";
import pb from "@/services/pocketbase";

const BranchDetailsTable = ({
  branchDetails = [],
  isLoading = false,
  onView,
  onEdit,
  onDelete
}) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super-admin";

  const columns = [
    {
      id: "branch_image",
      header: () => <div className="text-center font-medium">Image</div>,
      cell: ({ row }) => {
        const branchImage = row.original.branch_image;
        const imageUrl = branchImage
          ? pb.files.getUrl(row.original, branchImage)
          : "/Images/default_user.jpg";
        return (
          <div className="flex justify-center items-center">
            <div className="h-12 w-12 relative rounded-lg overflow-hidden border border-gray-950/20">
              <Image
                src={imageUrl}
                alt={row.original.branch_name || "Branch image"}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          </div>
        );
      },
      enableSorting: false,
      size: 80,
    },
    {
      accessorKey: "branch_name",
      header: () => <div className="text-left font-medium">Branch Name</div>,
      cell: ({ row }) => (
        <div className="text-left font-medium">
          {row.getValue("branch_name") || "Unnamed Branch"}
        </div>
      ),
      size: 160,
    },
    {
      accessorKey: "manager_name",
      header: () => <div className="text-left font-medium">Manager</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("manager_name") || "-"}</div>
      ),
      size: 140,
    },
    {
      accessorKey: "branch_email",
      header: () => <div className="text-left font-medium">Email</div>,
      cell: ({ row }) => (
        <div className="text-left text-sm">{row.getValue("branch_email") || "-"}</div>
      ),
      size: 180,
    },
    {
      id: "location",
      header: () => <div className="text-left font-medium">Location</div>,
      cell: ({ row }) => {
        const lat = row.original.branch_latitude;
        const lng = row.original.branch_longitude;
        return (
          <div className="text-left text-sm">
            {lat && lng ? (
              <Badge variant="secondary" className="text-xs">
                <Icon icon="mdi:map-marker" className="w-3 h-3 mr-1" />
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </Badge>
            ) : (
              <span className="text-gray-400">No location</span>
            )}
          </div>
        );
      },
      size: 140,
    },
    {
      accessorKey: "created",
      header: () => <div className="text-left font-medium">Created</div>,
      cell: ({ row }) => {
        const date = new Date(row.getValue("created"));
        return (
          <div className="text-left text-sm text-gray-600">
            {date.toLocaleDateString()}
          </div>
        );
      },
      size: 100,
    },
    {
      id: "actions",
      header: () => <div className="text-right font-medium">Actions</div>,
      cell: ({ row }) => {
        const branchDetail = row.original;
        const canEdit = isSuperAdmin || branchDetail.user_id === user?.id;
        const canDelete = isSuperAdmin;

        return (
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onView?.(branchDetail)}
              title="View Details"
            >
              <Icon icon="mdi:eye-outline" width={16} />
            </Button>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onEdit?.(branchDetail)}
                title="Edit Branch"
              >
                <Icon icon="mdi:pencil-outline" width={16} />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete?.(branchDetail)}
                title="Delete Branch"
              >
                <Icon icon="mdi:trash-can-outline" width={16} />
              </Button>
            )}
          </div>
        );
      },
      size: 140,
    },
  ];

  const table = useReactTable({
    data: branchDetails || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-md border">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white shadow-sm">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-4 py-3 bg-gray-50 font-semibold"
                    style={{ width: header.column.columnDef.size }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-4"
                      style={{ width: cell.column.columnDef.size }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Icon icon="mdi:office-building-outline" className="w-8 h-8 text-gray-300" />
                    No branch details found.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BranchDetailsTable;
