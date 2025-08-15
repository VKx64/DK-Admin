"use client";
import React, { useState } from 'react'
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
import { Edit, Trash2, Percent } from 'lucide-react'
import Image from 'next/image'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'
import ProductForm from './ProductForm'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { deleteProductWithAllData, deleteManyProducts } from '@/services/pocketbase/deleteProducts'
import { updateBatchProductsRelatedData } from '@/services/pocketbase/updateProducts'
import { canManageProducts, canManagePricing, getPermissionErrorMessage } from '@/utils/roleUtils'

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
 * DataTable - A reusable table component for displaying and managing data
 *
 * @param {Object} props
 * @param {Array} props.data - Array of data objects to display in the table
 * @param {Object} props.rowSelection - Currently selected rows
 * @param {Function} props.setRowSelection - Function to update row selection state
 * @param {Function} props.onTableReady - Function called with the table instance after creation
 * @param {Function} props.onDataChanged - Function called when data is changed (create/update/delete)
 * @param {String} props.userRole - User role for access control
 */
const DataTable = ({ data, rowSelection, setRowSelection, onTableReady, onDataChanged, userRole }) => {
  // State for controlling the edit product form
  const [editProduct, setEditProduct] = useState(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  // State for delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    productId: null,
    productName: "",
    isBulkDelete: false,
  });

  // State for batch discount dialog
  const [discountDialog, setDiscountDialog] = useState({
    isOpen: false,
    discountValue: 0,
  });

  // State for loading indicators
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingDiscount, setIsUpdatingDiscount] = useState(false);

  // Define column configuration
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
      enableHiding: false,
      size: 40, // Column width in pixels
    },

    // Product image column
    {
      id: "image",
      header: () => <div className="text-center font-medium">Image</div>,
      cell: ({ row }) => (
        <div className="flex justify-center items-center">
          <div className="h-10 w-10 relative rounded-md overflow-hidden">
            <Image
              src={row.original.image}
              alt={row.original.name}
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
        </div>
      ),
      enableSorting: false,
      size: 60,
    },

    // Product name column
    {
      accessorKey: "name",
      header: () => <div className="text-left font-medium">Product Name</div>,
      cell: ({ row }) => (
        <div className="text-left font-medium">{row.getValue("name")}</div>
      ),
    },

    // Category column
    {
      accessorKey: "category",
      header: () => <div className="text-left font-medium">Category</div>,
      cell: ({ row }) => (
        <div className="text-left">{row.getValue("category")}</div>
      ),
      size: 120,
    },

    // Stock column
    {
      accessorKey: "stock",
      header: () => <div className="text-center font-medium">Stock</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("stock")}</div>
      ),
      size: 70,
    },

    // Price column
    {
      accessorKey: "price",
      header: () => <div className="text-right font-medium">Price</div>,
      cell: ({ row }) => {
        // Format the price as currency (e.g., $299.99)
        const amount = parseFloat(row.getValue("price"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);
        return <div className="text-right font-medium">{formatted}</div>;
      },
      size: 100,
    },

    // Discount column
    {
      accessorKey: "discount",
      header: () => <div className="text-center font-medium">Discount</div>,
      cell: ({ row }) => {
        const discountValue = row.getValue("discount");
        return (
          <div className={`text-center ${discountValue > 0 ? "text-green-600 font-medium" : "text-gray-500"}`}>
            {discountValue > 0 ? `${discountValue}%` : "—"}
          </div>
        );
      },
      size: 80,
    },

    // Actions column (edit, delete buttons)
    {
      id: "actions",
      header: () => <div className="text-right font-medium">Actions</div>,
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleEditProduct(row.original)}
            disabled={!canManageProducts(userRole)}
            title={!canManageProducts(userRole) ? 'Only super-admin can edit products' : 'Edit product'}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleDeleteConfirmation(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      size: 80,
    },
  ];

  // Create table instance with TanStack Table
  const table = useReactTable({
    data,
    columns,
    enableRowSelection: true,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 15, // Show 15 products per page
      },
    },
  });

  // Give parent access to the table instance
  React.useEffect(() => {
    if (onTableReady) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

  // Handle editing a product
  const handleEditProduct = (product) => {
    setEditProduct(product);
    setIsEditFormOpen(true);
  };

  // Handle product form success (create/update)
  const handleProductFormSuccess = (result) => {
    // Notify parent component about the change
    if (onDataChanged) {
      onDataChanged();
    }
  };

  // Handle delete confirmation for a single product
  const handleDeleteConfirmation = (product) => {
    setDeleteDialog({
      isOpen: true,
      productId: product.id,
      productName: product.name,
      isBulkDelete: false
    });
  };

  // Handle bulk delete confirmation
  const handleBulkDeleteConfirmation = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length > 0) {
      setDeleteDialog({
        isOpen: true,
        productId: selectedRows.map(row => row.original.id),
        productName: `${selectedRows.length} products`,
        isBulkDelete: true
      });
    }
  };

  // Execute product deletion
  const handleDeleteProduct = async () => {
    setIsDeleting(true);
    try {
      let result;

      if (deleteDialog.isBulkDelete) {
        // Delete multiple products
        result = await deleteManyProducts(deleteDialog.productId);
      } else {
        // Delete single product
        result = await deleteProductWithAllData(deleteDialog.productId);
      }

      if (result.success) {
        // Clear row selection after deletion
        setRowSelection({});
        // Notify parent that data has changed
        if (onDataChanged) {
          onDataChanged();
        }
      } else {
        console.error("Error deleting product(s):", result.message);
        alert(`Failed to delete: ${result.message}`);
      }
    } catch (error) {
      console.error("Error in deletion:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
      // Close the dialog
      setDeleteDialog({ isOpen: false, productId: null, productName: "" });
    }
  };

  // Handle batch discount confirmation
  const handleBatchDiscountConfirmation = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length > 0) {
      setDiscountDialog({
        isOpen: true,
        discountValue: 0,
      });
    }
  };

  // Execute batch discount update
  const handleUpdateBatchDiscount = async () => {
    setIsUpdatingDiscount(true);
    try {
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const productIds = selectedRows.map(row => row.original.id);
      const result = await updateBatchProductsRelatedData(productIds, { discount: discountDialog.discountValue });

      if (result.success) {
        // Notify parent that data has changed
        if (onDataChanged) {
          onDataChanged();
        }
      } else {
        console.error("Error updating discount:", result.message);
        alert(`Failed to update discount: ${result.message}`);
      }
    } catch (error) {
      console.error("Error in updating discount:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsUpdatingDiscount(false);
      // Close the dialog
      setDiscountDialog({ isOpen: false, discountValue: 0 });
    }
  };

  return (
    <>
      {/* Product Table Container */}
      <div className="rounded-md border overflow-hidden flex-1 flex flex-col">
        {/* Bulk delete button - shows when items are selected */}
        {Object.keys(rowSelection).length > 0 && (
          <div className="bg-gray-50 p-2 flex justify-between items-center border-b">
            <span className="text-sm text-gray-600 ml-2">
              {Object.keys(rowSelection).length} item(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDeleteConfirmation}
                className="mr-2"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchDiscountConfirmation}
                className="mr-2"
                disabled={!canManagePricing(userRole)}
                title={!canManagePricing(userRole) ? getPermissionErrorMessage('batch-discount', userRole) : 'Apply batch discount'}
              >
                <Percent className="h-4 w-4 mr-1" /> Apply Discount
              </Button>
            </div>
          </div>
        )}

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
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Product Edit Form */}
      {isEditFormOpen && (
        <ProductForm
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          productData={editProduct}
          onSuccess={handleProductFormSuccess}
          userRole={userRole}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !isDeleting && setDeleteDialog(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.isBulkDelete
                ? `You are about to delete ${deleteDialog.productName}.`
                : `You are about to delete "${deleteDialog.productName}".`}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Discount Dialog */}
      <Dialog open={discountDialog.isOpen} onOpenChange={(open) => !isUpdatingDiscount && setDiscountDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>
              Enter the discount percentage to apply to the selected products.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discount" className="text-right">
                Discount (%)
              </Label>
              <Input
                id="discount"
                type="number"
                value={discountDialog.discountValue}
                onChange={(e) => setDiscountDialog(prev => ({ ...prev, discountValue: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountDialog(prev => ({ ...prev, isOpen: false }))} disabled={isUpdatingDiscount}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBatchDiscount} disabled={isUpdatingDiscount}>
              {isUpdatingDiscount ? "Applying..." : "Apply Discount"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DataTable;