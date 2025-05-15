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
import { Icon } from "@iconify/react";
import Image from "next/image";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
} from "@tanstack/react-table";

const BranchTable = ({ users = [], isLoading = false, onView, onEdit, onDelete }) => {
  const columns = [
    {
      id: "avatar",
      header: () => <div className="text-center font-medium">Profile</div>,
      cell: ({ row }) => {
        const avatar = row.original.avatar;
        const imageUrl = avatar
          ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${row.original.id}/${avatar}`
          : "/Images/default_user.jpg";
        return (
          <div className="flex justify-center items-center">
            <div className="h-10 w-10 relative rounded-full overflow-hidden border border-gray-950/20">
              <Image
                src={imageUrl}
                alt={row.original.name || "Admin image"}
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
    {
      accessorKey: "name",
      header: () => <div className="text-left font-medium">Name</div>,
      cell: ({ row }) => (
        <div className="text-left font-medium">{row.getValue("name") || "Unnamed Admin"}</div>
      ),
      size: 180,
    },
    {
      accessorKey: "email",
      header: () => <div className="text-left font-medium">Email</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("email") || "-"}</div>
      ),
      size: 180,
    },
    {
      accessorKey: "role",
      header: () => <div className="text-left font-medium">Role</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("role") || "-"}</div>
      ),
      size: 100,
    },
    {
      id: "actions",
      header: () => <div className="text-right font-medium">Actions</div>,
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onView?.(row.original)}>
            <Icon icon="mdi:eye-outline" width={16} />
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit?.(row.original)}>
            <Icon icon="mdi:pencil-outline" width={16} />
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete?.(row.original)}>
            <Icon icon="mdi:trash-can-outline" width={16} />
          </Button>
        </div>
      ),
      size: 120,
    },
  ];

  const table = useReactTable({
    data: users || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-3"
                      style={{ width: cell.column.columnDef.size }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No admins found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BranchTable;
