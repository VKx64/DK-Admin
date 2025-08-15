"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import pb from "@/services/pocketbase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const QuickBranchView = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [branchDetails, setBranchDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.role === "super-admin";

  useEffect(() => {
    const fetchMyBranchDetails = async () => {
      if (!user?.id || !isAdmin) return;

      setLoading(true);
      try {
        const result = await pb.collection("branch_details").getFullList({
          filter: `user_id="${user.id}"`,
          sort: "-created",
          requestKey: null
        });

        if (result.length > 0) {
          setBranchDetails(result[0]);
        } else {
          setBranchDetails(null);
        }
      } catch (error) {
        console.error("Error fetching branch details:", error);
        setBranchDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBranchDetails();
  }, [user, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <Icon icon="mdi:lock" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Access denied. Admin role required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!branchDetails) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <Icon icon="mdi:office-building-outline" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Branch Details Found
          </h3>
          <p className="text-gray-500 mb-6">
            You haven't set up your branch details yet. Click below to create them.
          </p>
          <Button
            onClick={() => router.push('/branch_details')}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
            Create Branch Details
          </Button>
        </CardContent>
      </Card>
    );
  }

  const imageUrl = branchDetails.branch_image
    ? pb.files.getUrl(branchDetails, branchDetails.branch_image)
    : "/Images/default_user.jpg";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mdi:office-building" className="w-5 h-5 text-indigo-600" />
              My Branch Details
            </CardTitle>
            <Button
              onClick={() => router.push('/branch_details')}
              variant="outline"
              size="sm"
            >
              <Icon icon="mdi:cog" className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Branch Image */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <Image
                  src={imageUrl}
                  alt={branchDetails.branch_name || "Branch"}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {branchDetails.branch_name}
                </h2>
                <p className="text-gray-600">
                  Managed by {branchDetails.manager_name}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:email" className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {branchDetails.branch_email}
                  </span>
                </div>

                {branchDetails.branch_latitude && branchDetails.branch_longitude && (
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:map-marker" className="w-4 h-4 text-gray-400" />
                    <Badge variant="secondary" className="text-xs">
                      {branchDetails.branch_latitude.toFixed(4)}, {branchDetails.branch_longitude.toFixed(4)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/branch_details')}>
          <CardContent className="p-6 text-center">
            <Icon icon="mdi:pencil" className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">Edit Details</h3>
            <p className="text-sm text-gray-500">Update branch information</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/orders')}>
          <CardContent className="p-6 text-center">
            <Icon icon="mdi:package-variant" className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">Manage Orders</h3>
            <p className="text-sm text-gray-500">View and process orders</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/parts')}>
          <CardContent className="p-6 text-center">
            <Icon icon="mdi:wrench" className="w-8 h-8 text-orange-500 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">Manage Parts</h3>
            <p className="text-sm text-gray-500">Inventory and stock control</p>
          </CardContent>
        </Card>
      </div>

      {/* Location Map Link */}
      {branchDetails.branch_latitude && branchDetails.branch_longitude && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon icon="mdi:map" className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="font-medium text-gray-900">Branch Location</h3>
                  <p className="text-sm text-gray-500">
                    Coordinates: {branchDetails.branch_latitude.toFixed(6)}, {branchDetails.branch_longitude.toFixed(6)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `https://maps.google.com/?q=${branchDetails.branch_latitude},${branchDetails.branch_longitude}`;
                  window.open(url, "_blank");
                }}
              >
                <Icon icon="mdi:map-marker" className="w-4 h-4 mr-2" />
                View on Map
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuickBranchView;
