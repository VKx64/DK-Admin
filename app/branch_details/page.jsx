"use client";
import React, { useState, useEffect } from "react";
import BranchDetailsHeader from "@/components/v1/branch_details/BranchDetailsHeader";
import BranchDetailsTable from "@/components/v1/branch_details/BranchDetailsTable";
import ViewBranchDetails from "@/components/v1/branch_details/ViewBranchDetails";
import EditBranchDetails from "@/components/v1/branch_details/EditBranchDetails";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import pb from "@/services/pocketbase";
import { useAuth } from "@/context/AuthContext";

const BranchDetailsPage = () => {
  const { user } = useAuth();
  const [branchDetails, setBranchDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBranchDetail, setSelectedBranchDetail] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isSuperAdmin = user?.role === "super-admin";
  const isAdmin = user?.role === "admin";

  const fetchBranchDetails = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      let result;

      if (isSuperAdmin) {
        // Super admin can see all branch details
        result = await pb.collection("branch_details").getFullList({
          sort: "-created",
          requestKey: null
        });
      } else if (isAdmin) {
        // Regular admin can only see their own branch details
        result = await pb.collection("branch_details").getFullList({
          filter: `user_id="${user.id}"`,
          sort: "-created",
          requestKey: null
        });
      } else {
        result = [];
      }

      setBranchDetails(result || []);
    } catch (error) {
      console.error("Error fetching branch details:", error);
      setBranchDetails([]);
      toast.error("Error", {
        description: "Failed to fetch branch details"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchDetails();
  }, [user, isSuperAdmin, isAdmin]);

  const handleView = (branchDetail) => {
    setSelectedBranchDetail(branchDetail);
    setViewOpen(true);
  };

  const handleEdit = (branchDetail) => {
    // Check permissions
    if (!isSuperAdmin && branchDetail.user_id !== user?.id) {
      toast.error("Access Denied", {
        description: "You can only edit your own branch details"
      });
      return;
    }

    setSelectedBranchDetail(branchDetail);
    setEditOpen(true);
  };

  const handleDelete = (branchDetail) => {
    // Only super admin can delete - admins cannot delete at all
    if (!isSuperAdmin) {
      toast.error("Access Denied", {
        description: "Only super administrators can delete branch details"
      });
      return;
    }

    setSelectedBranchDetail(branchDetail);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBranchDetail || !isSuperAdmin) return;

    setDeleting(true);
    try {
      await pb.collection("branch_details").delete(selectedBranchDetail.id, {
        requestKey: null
      });
      setDeleteOpen(false);
      setSelectedBranchDetail(null);
      fetchBranchDetails();
      toast.success("Success", {
        description: "Branch details deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting branch details:", error);
      toast.error("Error", {
        description: error.message || "Failed to delete branch details"
      });
    } finally {
      setDeleting(false);
    }
  };

  // Show access denied for unauthorized users
  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-md text-center">
          <Icon icon="mdi:lock" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">
            You don't have permission to access branch details management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] gap-4 flex flex-col">
      {/* Header */}
      <BranchDetailsHeader onCreated={fetchBranchDetails} />

      {/* Table */}
      <BranchDetailsTable
        branchDetails={branchDetails}
        isLoading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* View Dialog */}
      <ViewBranchDetails
        open={viewOpen}
        onOpenChange={setViewOpen}
        branchDetail={selectedBranchDetail}
      />

      {/* Edit Dialog - Only show if user can edit */}
      {(isSuperAdmin || (selectedBranchDetail && selectedBranchDetail.user_id === user?.id)) && (
        <EditBranchDetails
          open={editOpen}
          onOpenChange={setEditOpen}
          branchDetail={selectedBranchDetail}
          onSuccess={fetchBranchDetails}
        />
      )}

      {/* Delete Confirmation Dialog - Only for super admin */}
      {isSuperAdmin && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon icon="mdi:delete-alert" className="w-5 h-5 text-red-500" />
                Delete Branch Details
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <p className="text-gray-600">
                Are you sure you want to delete the branch details for{" "}
                <span className="font-semibold text-gray-900">
                  {selectedBranchDetail?.branch_name}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:delete" className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BranchDetailsPage;
