"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import pb from "@/services/pocketbase";
import { useAuth } from "@/context/AuthContext";
import { getUsersByRole } from "@/services/pocketbase/readUsers";

const NewBranchDetails = ({ open, onOpenChange, onCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [availableAdmins, setAvailableAdmins] = useState([]);
  const [formData, setFormData] = useState({
    branch_name: "",
    manager_name: "",
    branch_email: "",
    branch_latitude: "",
    branch_longitude: "",
    user_id: "",
  });
  const [branchImage, setBranchImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const isSuperAdmin = user?.role === "super-admin";

  // Fetch available admin users when dialog opens
  useEffect(() => {
    const fetchAvailableAdmins = async () => {
      if (!open || !isSuperAdmin) return;

      setLoadingAdmins(true);
      try {
        // Get all admin users
        const allAdmins = await getUsersByRole('admin');

        // Get all existing branch details to find which admins already have branches
        const existingBranches = await pb.collection("branch_details").getFullList({
          fields: 'user_id',
          requestKey: null
        });

        const assignedAdminIds = new Set(existingBranches.map(branch => branch.user_id));

        // Filter out admins who already have branches assigned
        const availableAdmins = allAdmins.filter(admin => !assignedAdminIds.has(admin.id));

        setAvailableAdmins(availableAdmins);
      } catch (error) {
        console.error("Error fetching available admins:", error);
        toast.error("Error", {
          description: "Failed to fetch available admin users"
        });
        setAvailableAdmins([]);
      } finally {
        setLoadingAdmins(false);
      }
    };

    fetchAvailableAdmins();
  }, [open, isSuperAdmin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setBranchImage(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();

      // For super-admin, use the specified user_id, for admin use current user's id
      const targetUserId = isSuperAdmin && formData.user_id
        ? formData.user_id
        : user?.id;

      if (!targetUserId) {
        toast.error("Error", { description: "User ID is required" });
        return;
      }

      data.append("branch_name", formData.branch_name);
      data.append("manager_name", formData.manager_name);
      data.append("branch_email", formData.branch_email);
      data.append("user_id", targetUserId);

      const lat = parseFloat(formData.branch_latitude);
      const lng = parseFloat(formData.branch_longitude);
      if (!isNaN(lat)) data.append("branch_latitude", lat);
      if (!isNaN(lng)) data.append("branch_longitude", lng);

      if (branchImage) {
        data.append("branch_image", branchImage);
      }

      await pb.collection("branch_details").create(data, {
        requestKey: null
      });

      toast.success("Success", {
        description: "Branch details created successfully"
      });

      // Reset form
      setFormData({
        branch_name: "",
        manager_name: "",
        branch_email: "",
        branch_latitude: "",
        branch_longitude: "",
        user_id: "",
      });
      setBranchImage(null);
      setImagePreview(null);

      onCreated?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating branch details:", error);
      toast.error("Error", {
        description: error.message || "Failed to create branch details"
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        branch_name: "",
        manager_name: "",
        branch_email: "",
        branch_latitude: "",
        branch_longitude: "",
        user_id: "",
      });
      setBranchImage(null);
      setImagePreview(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="mdi:office-building-plus" className="w-5 h-5 text-indigo-600" />
            Create New Branch Details
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Super Admin: Admin User Selection */}
          {isSuperAdmin && (
            <div className="space-y-2">
              <Label htmlFor="user_id">Select Admin User *</Label>
              {loadingAdmins ? (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                  <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Loading admin users...</span>
                </div>
              ) : (
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => handleSelectChange('user_id', value)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an admin user" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAdmins.length > 0 ? (
                      availableAdmins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          <div className="flex items-center gap-2">
                            <Icon icon="mdi:account" className="w-4 h-4 text-gray-500" />
                            <div className="flex flex-col">
                              <span className="font-medium">{admin.name || admin.email}</span>
                              <span className="text-xs text-gray-500">{admin.email}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        No available admin users
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-gray-500">
                {availableAdmins.length > 0
                  ? "Select an admin user who will manage this branch. Only admins without existing branches are shown."
                  : "All admin users already have branches assigned or no admin users exist."
                }
              </p>
            </div>
          )}

          {/* Branch Name */}
          <div className="space-y-2">
            <Label htmlFor="branch_name">Branch Name *</Label>
            <Input
              id="branch_name"
              name="branch_name"
              value={formData.branch_name}
              onChange={handleInputChange}
              placeholder="Enter branch name"
              required
            />
          </div>

          {/* Manager Name */}
          <div className="space-y-2">
            <Label htmlFor="manager_name">Manager Name *</Label>
            <Input
              id="manager_name"
              name="manager_name"
              value={formData.manager_name}
              onChange={handleInputChange}
              placeholder="Enter manager name"
              required
            />
          </div>

          {/* Branch Email */}
          <div className="space-y-2">
            <Label htmlFor="branch_email">Branch Email *</Label>
            <Input
              id="branch_email"
              name="branch_email"
              type="email"
              value={formData.branch_email}
              onChange={handleInputChange}
              placeholder="Enter branch email"
              required
            />
          </div>

          {/* Branch Image */}
          <div className="space-y-2">
            <Label htmlFor="branch_image">Branch Image</Label>
            <Input
              id="branch_image"
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              className="cursor-pointer"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch_latitude">Latitude *</Label>
              <Input
                id="branch_latitude"
                name="branch_latitude"
                type="number"
                step="any"
                value={formData.branch_latitude}
                onChange={handleInputChange}
                placeholder="Enter latitude"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch_longitude">Longitude *</Label>
              <Input
                id="branch_longitude"
                name="branch_longitude"
                type="number"
                step="any"
                value={formData.branch_longitude}
                onChange={handleInputChange}
                placeholder="Enter longitude"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
                  Create Branch Details
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewBranchDetails;
