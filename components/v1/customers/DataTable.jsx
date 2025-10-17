"use client";
import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Icon } from "@iconify/react";
import pb from "@/services/pocketbase";

const DataTable = ({ data, onViewCustomer, user }) => {
  const [sorting, setSorting] = useState([]);

  // Define columns
  const columns = useMemo(
    () => [
      // Checkbox column
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },

      // Avatar column
      {
        id: "avatar",
        header: () => <div className="text-left font-medium">Avatar</div>,
        cell: ({ row }) => {
          const customer = row.original;
          const avatarUrl = customer.avatar
            ? pb.files.getUrl(customer, customer.avatar, { thumb: '40x40' })
            : null;
          const initials = customer.name
            ? customer.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : 'NA';

          return (
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={customer.name || 'Customer'} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          );
        },
        size: 60,
      },

      // Customer Name column
      {
        accessorKey: "name",
        header: () => <div className="text-left font-medium">Name</div>,
        cell: ({ row }) => {
          const name = row.getValue("name") || "N/A";
          return <div className="text-left font-medium">{name}</div>;
        },
        size: 180,
      },

      // Email column
      {
        accessorKey: "email",
        header: () => <div className="text-left font-medium">Email</div>,
        cell: ({ row }) => {
          const email = row.getValue("email");
          return <div className="text-left text-sm">{email}</div>;
        },
        size: 220,
      },

      // Branch column (conditional for super-admin)
      ...(user?.role === 'super-admin' ? [{
        id: "branchName",
        header: () => <div className="text-left font-medium">Last Order Branch</div>,
        cell: ({ row }) => {
          const customer = row.original;
          const branchName = customer.lastOrderBranchDetails?.branch_name;

          if (!branchName) {
            return (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                <Icon icon="mdi:alert-circle-outline" className="w-3 h-3 mr-1" />
                No Orders
              </Badge>
            );
          }

          return (
            <div className="text-left text-sm">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {branchName}
              </Badge>
            </div>
          );
        },
        size: 150,
      }] : []),

      // Verified Status column
      {
        accessorKey: "verified",
        header: () => <div className="text-left font-medium">Status</div>,
        cell: ({ row }) => {
          const verified = row.getValue("verified");
          return (
            <div className="text-left">
              {verified ? (
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  <Icon icon="mdi:check-circle" className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-700">
                  <Icon icon="mdi:clock-outline" className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          );
        },
        size: 100,
      },

      // Total Orders column
      {
        id: "totalOrders",
        header: () => <div className="text-center font-medium">Orders</div>,
        cell: ({ row }) => {
          const stats = row.original.orderStats;
          return (
            <div className="text-center">
              <span className="font-medium">{stats?.total || 0}</span>
            </div>
          );
        },
        size: 80,
      },

      // Join Date column
      {
        accessorKey: "created",
        header: () => <div className="text-left font-medium">Joined</div>,
        cell: ({ row }) => {
          const date = new Date(row.getValue("created"));
          const formatted = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }).format(date);
          return <div className="text-left text-sm">{formatted}</div>;
        },
        size: 120,
      },

      // Actions column
      {
        id: "actions",
        header: () => <div className="text-center font-medium">Actions</div>,
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewCustomer(customer)}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        size: 80,
      },
    ],
    [user?.role, onViewCustomer]
  );

  // Initialize table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.column.columnDef.size }}>
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
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Icon icon="mdi:account-search-outline" className="w-12 h-12 mb-2 opacity-50" />
                    <p>No customers found</p>
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

export default DataTable;
