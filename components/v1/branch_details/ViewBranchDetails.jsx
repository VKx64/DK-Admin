"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import Image from "next/image";
import pb from "@/services/pocketbase";

const ViewBranchDetails = ({ open, onOpenChange, branchDetail }) => {
  if (!branchDetail) return null;

  const imageUrl = branchDetail.branch_image
    ? pb.files.getUrl(branchDetail, branchDetail.branch_image)
    : "/Images/default_user.jpg";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="mdi:office-building" className="w-5 h-5 text-indigo-600" />
            Branch Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Branch Image */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <Image
                src={imageUrl}
                alt={branchDetail.branch_name || "Branch"}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          </div>

          {/* Branch Information */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:office-building" className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">Branch Name:</span>
              </div>
              <span className="text-gray-900 font-semibold">
                {branchDetail.branch_name || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:account-tie" className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">Manager:</span>
              </div>
              <span className="text-gray-900">
                {branchDetail.manager_name || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:email" className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">Email:</span>
              </div>
              <span className="text-gray-900">
                {branchDetail.branch_email || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:map-marker" className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">Location:</span>
              </div>
              <div className="text-right">
                {branchDetail.branch_latitude && branchDetail.branch_longitude ? (
                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-xs">
                      Lat: {branchDetail.branch_latitude.toFixed(6)}
                    </Badge>
                    <br />
                    <Badge variant="secondary" className="text-xs">
                      Lng: {branchDetail.branch_longitude.toFixed(6)}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-gray-400">No location data</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:account" className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">User ID:</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {branchDetail.user_id || "N/A"}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:calendar" className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">Created:</span>
              </div>
              <span className="text-gray-600 text-sm">
                {new Date(branchDetail.created).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:update" className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">Updated:</span>
              </div>
              <span className="text-gray-600 text-sm">
                {new Date(branchDetail.updated).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Map Link */}
          {branchDetail.branch_latitude && branchDetail.branch_longitude && (
            <div className="pt-4">
              <a
                href={`https://maps.google.com/?q=${branchDetail.branch_latitude},${branchDetail.branch_longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Icon icon="mdi:map" className="w-4 h-4" />
                View on Google Maps
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewBranchDetails;
