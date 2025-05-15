"use client";
import React from "react";
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
import Image from "next/image";
import { Icon } from "@iconify/react";

const ViewAdmin = ({ open, onOpenChange, admin }) => {
  if (!admin) return null;

  // Helper for avatar
  const avatarUrl = admin.avatar
    ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${admin.id}/${admin.avatar}`
    : "/Images/default_user.jpg";

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            Admin Details
          </DialogTitle>
          <DialogDescription>
            Complete information about the admin
          </DialogDescription>
        </DialogHeader>

        {/* Admin header with avatar */}
        <div className="flex items-center gap-4 pb-4">
          <div className="h-16 w-16 relative rounded-full overflow-hidden border-2 border-gray-200">
            <Image
              src={avatarUrl}
              alt={admin.name || "Admin"}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium">{admin.name || "Unnamed Admin"}</h3>
            <p className="text-sm text-gray-500">{admin.email}</p>
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
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="font-medium text-gray-700">Name:</div>
                <div>{admin.name || "—"}</div>

                <div className="font-medium text-gray-700">Email:</div>
                <div>{admin.email || "—"}</div>

                <div className="font-medium text-gray-700">Role:</div>
                <div className="capitalize">{admin.role || "—"}</div>
              </div>
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Account Information</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="font-medium text-gray-700">Account ID:</div>
                <div className="font-mono text-xs">{admin.id || "—"}</div>

                <div className="font-medium text-gray-700">Account Created:</div>
                <div>{formatDate(admin.created)}</div>

                <div className="font-medium text-gray-700">Last Updated:</div>
                <div>{formatDate(admin.updated)}</div>

                <div className="font-medium text-gray-700">Verified:</div>
                <div className="flex items-center">
                  {admin.verified ? (
                    <span className="text-green-600 flex items-center">
                      <Icon icon="mdi:check-circle" className="h-4 w-4 mr-1" /> Verified
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center">
                      <Icon icon="mdi:alert-circle" className="h-4 w-4 mr-1" /> Not verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAdmin;