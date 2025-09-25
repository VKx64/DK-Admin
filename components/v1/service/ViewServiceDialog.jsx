"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from "@iconify/react";
import DiagnoseServiceDialog from './DiagnoseServiceDialog';
import pb from "@/services/pocketbase";
import { toast } from "sonner";

const ViewServiceDialog = ({ isOpen, onOpenChange, service, onServiceUpdate }) => {
  const [isDiagnoseDialogOpen, setIsDiagnoseDialogOpen] = useState(false);
  const [isCompletingService, setIsCompletingService] = useState(false);

  if (!service) return null;

  // Format the attachment URL if it exists
  const attachmentUrl = service.attachmentUrl || "/Images/default_user.jpg";

  // Get current user info
  const currentUser = pb.authStore?.model;
  const isTechnician = currentUser?.role === 'technician';
  const isAssignedTechnician = isTechnician && service.assignedTechnician === currentUser?.name;

  // Format status text for display
  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status === "in_progress" ? "In Progress" :
           status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Handle opening attachment in new tab
  const openAttachmentInNewTab = () => {
    if (service.attachmentUrl) {
      window.open(service.attachmentUrl, '_blank');
    }
  };

  // Handle diagnosis completion
  const handleDiagnosisComplete = () => {
    onServiceUpdate?.(); // Refresh the service data
  };

  // Handle service completion
  const handleCompleteService = async () => {
    if (!isAssignedTechnician) {
      toast.error('Only the assigned technician can complete this service');
      return;
    }

    setIsCompletingService(true);
    try {
      await pb.collection('service_request').update(service.id, {
        status: 'complete',
        completed_by: currentUser.id,
        completed_date: new Date().toISOString()
      });

      toast.success('Service marked as complete!');
      onServiceUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing service:', error);
      toast.error('Failed to complete service');
    } finally {
      setIsCompletingService(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            Service Request Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this service request
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="info" className="flex items-center gap-1">
              <Icon icon="mdi:information-outline" width={16} height={16} /> Details
            </TabsTrigger>
            <TabsTrigger value="problem" className="flex items-center gap-1">
              <Icon icon="mdi:message-processing-outline" width={16} height={16} /> Problem
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1">
              <Icon icon="mdi:calendar-outline" width={16} height={16} /> Schedule
            </TabsTrigger>
            <TabsTrigger value="attachment" className="flex items-center gap-1">
              <Icon icon="mdi:file-document-outline" width={16} height={16} /> Attachment
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="info" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Customer Information</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="font-medium text-gray-700">Customer:</div>
                <div>{service.user || '—'}</div>

                <div className="font-medium text-gray-700">Product:</div>
                <div>{service.product || '—'}</div>

                <div className="font-medium text-gray-700">Status:</div>
                <div>{formatStatus(service.status)}</div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Assignment Details</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="font-medium text-gray-700">Assigned Technician:</div>
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:tools" width={16} height={16} className="text-gray-500" />
                  {service.assignedTechnician || 'Unassigned'}
                </div>

                <div className="font-medium text-gray-700">Created Date:</div>
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:calendar-clock" width={16} height={16} className="text-gray-500" />
                  {service.createdDate || '—'}
                </div>

                <div className="font-medium text-gray-700">Request ID:</div>
                <div className="font-mono text-xs">{service.id || '—'}</div>
              </div>
            </div>
          </TabsContent>

          {/* Problem Description Tab */}
          <TabsContent value="problem" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Problem Description</h4>
              <div className="text-sm p-3 bg-white rounded-md border whitespace-pre-wrap">
                {service.problem || "No description provided"}
              </div>
            </div>

            {/* Remarks Section (if available) */}
            {service.remarks && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium mb-3">Remarks</h4>
                <div className="text-sm whitespace-pre-wrap">
                  {service.remarks}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Schedule Information</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="font-medium text-gray-700">Product:</div>
                <div>{service.product || '—'}</div>

                <div className="font-medium text-gray-700">Status:</div>
                <div>{formatStatus(service.status)}</div>

                <div className="font-medium text-gray-700">Requested Date:</div>
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:calendar" width={16} height={16} className="text-gray-500" />
                  {service.requestedDate || 'Not specified'}
                </div>

                <div className="font-medium text-gray-700">Scheduled Date:</div>
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:calendar-clock" width={16} height={16} className="text-gray-500" />
                  {service.scheduledDate || 'Not scheduled yet'}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Attachment Tab */}
          <TabsContent value="attachment" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3 flex justify-between items-center">
                Attachment
              </h4>
              {service.hasAttachment ? (
                <div
                  className="cursor-pointer"
                  onClick={openAttachmentInNewTab}
                >
                  <div className="relative w-full h-0 pb-[50%] rounded-md overflow-hidden">
                    <Image
                      src={attachmentUrl}
                      alt="Service attachment"
                      fill
                      className="object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white bg-black bg-opacity-50 px-2 py-2 rounded text-sm flex items-center gap-1">
                        <Icon icon="mdi:open-in-new" width={14} height={14} /> Click to view full image
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-32 bg-gray-100 rounded-md">
                  <div className="flex flex-col items-center text-gray-500">
                    <Icon icon="mdi:file-document-outline" width={40} height={40} className="mb-2" />
                    <span>No attachment provided</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          {/* Technician Actions */}
          {isAssignedTechnician && (
            <>
              {service.status !== 'scheduled' && service.status !== 'complete' && (
                <Button
                  onClick={() => setIsDiagnoseDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Icon icon="mdi:stethoscope" className="h-4 w-4 mr-2" />
                  Diagnose
                </Button>
              )}

              {service.status === 'scheduled' && (
                <Button
                  onClick={handleCompleteService}
                  disabled={isCompletingService}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCompletingService ? (
                    <>
                      <Icon icon="mdi:loading" className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:check-circle" className="h-4 w-4 mr-2" />
                      Complete Service
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Diagnose Service Dialog */}
      {/* Diagnose Service Dialog */}
      <DiagnoseServiceDialog
        isOpen={isDiagnoseDialogOpen}
        onOpenChange={setIsDiagnoseDialogOpen}
        service={service}
        onDiagnosisComplete={handleDiagnosisComplete}
      />
    </Dialog>
  );
};

export default ViewServiceDialog;