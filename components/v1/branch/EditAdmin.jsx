"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { updateUser } from "@/services/pocketbase/updateUsers";

const EditAdmin = ({ open, onOpenChange, admin, onSuccess }) => {
  if (!admin) return null;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    verified: false,
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Helper for avatar
  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (admin.avatar)
      return `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${admin.id}/${admin.avatar}`;
    return "/Images/default_user.jpg";
  };

  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || "",
        email: admin.email || "",
        verified: admin.verified || false,
      });
      setAvatarPreview("");
      setAvatarFile(null);
      setError("");
    }
  }, [admin, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      let data = {
        name: formData.name,
        email: formData.email,
        verified: formData.verified,
      };
      if (avatarFile) {
        const formDataObj = new FormData();
        Object.entries(data).forEach(([key, value]) => formDataObj.append(key, value));
        formDataObj.append("avatar", avatarFile);
        await updateUser(admin.id, formDataObj);
      } else {
        await updateUser(admin.id, data);
      }
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "Failed to update admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Admin</DialogTitle>
          <DialogDescription>Update the admin information below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {/* Avatar upload */}
          <div className="flex items-center gap-4 pb-4">
            <div className="h-16 w-16 relative rounded-full overflow-hidden border-2 border-gray-200 group">
              <Image
                src={getAvatarUrl()}
                alt="Avatar"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label htmlFor="avatar-upload" className="cursor-pointer text-white">
                  <Icon icon="mdi:upload" className="h-6 w-6" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium">Profile Picture</h3>
              <p className="text-sm text-gray-500">Click on the image to change</p>
            </div>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="profile" className="flex items-center gap-1">
                <Icon icon="mdi:account" className="h-4 w-4" /> Profile
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-1">
                <Icon icon="mdi:calendar" className="h-4 w-4" /> Account
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Smith"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    id="verified"
                    name="verified"
                    type="checkbox"
                    checked={formData.verified}
                    onChange={handleChange}
                    className="accent-green-600 h-4 w-4"
                  />
                  <Label htmlFor="verified" className="cursor-pointer">
                    Verified
                  </Label>
                  {formData.verified ? (
                    <Icon icon="mdi:check-circle" className="h-4 w-4 text-green-600 ml-1" />
                  ) : (
                    <Icon icon="mdi:alert-circle" className="h-4 w-4 text-amber-600 ml-1" />
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mt-4 text-sm">{error}</div>
          )}

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icon icon="mdi:loading" className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAdmin;