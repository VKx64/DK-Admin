"use client";

import React from "react";
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

const ViewServiceHistoryDialog = ({ isOpen, onOpenChange, service }) => {
  if (!service) return null;

  // Format the attachment URL if it exists using PocketBase file URL helper
  const attachmentUrl = service.originalRecord?.attachment
    ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${service.originalRecord.collectionId}/${service.originalRecord.id}/${service.originalRecord.attachment}`
    : "/Images/default_user.jpg";

  // Format status text for display
  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status === "completed" ? "Completed" :
           status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Handle opening attachment in new tab
  const openAttachmentInNewTab = () => {
    if (service.originalRecord?.attachment) {
      const url = `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${service.originalRecord.collectionId}/${service.originalRecord.id}/${service.originalRecord.attachment}`;
      window.open(url, '_blank');
    }
  };

  // Calculate total parts cost
  const calculateTotalPartsCost = () => {
    if (!service.diagnosedParts || service.diagnosedParts.length === 0) return '0.00';

    return service.diagnosedParts.reduce((total, part) => {
      return total + (parseFloat(part.price || 0) * parseInt(part.quantity || 0));
    }, 0).toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Icon icon="mdi:history" className="h-6 w-6 text-green-600" />
            Completed Service Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this completed service request
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="info" className="flex items-center gap-1 text-xs">
              <Icon icon="mdi:information-outline" width={16} height={16} /> Details
            </TabsTrigger>
            <TabsTrigger value="problem" className="flex items-center gap-1 text-xs">
              <Icon icon="mdi:message-processing-outline" width={16} height={16} /> Problem
            </TabsTrigger>
            <TabsTrigger value="diagnosis" className="flex items-center gap-1 text-xs">
              <Icon icon="mdi:stethoscope" width={16} height={16} /> Diagnosis
            </TabsTrigger>
            <TabsTrigger value="parts" className="flex items-center gap-1 text-xs">
              <Icon icon="mdi:wrench-outline" width={16} height={16} /> Parts
            </TabsTrigger>
            <TabsTrigger value="attachment" className="flex items-center gap-1 text-xs">
              <Icon icon="mdi:file-document-outline" width={16} height={16} /> Files
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="info" className="space-y-4">
            <div className="bg-green-50 p-4 rounded-md">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Icon icon="mdi:check-circle" className="h-5 w-5 text-green-600" />
                Service Completed
              </h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="font-medium text-gray-700">Customer:</div>
                <div>{service.user || '—'}</div>

                <div className="font-medium text-gray-700">Product:</div>
                <div>{service.product || '—'}</div>

                <div className="font-medium text-gray-700">Status:</div>
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:check-circle" className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">{formatStatus(service.status)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Service Timeline</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="font-medium text-gray-700">Assigned Technician:</div>
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:tools" width={16} height={16} className="text-gray-500" />
                  {service.technician || 'Unassigned'}
                </div>

                <div className="font-medium text-gray-700">Created Date:</div>
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:calendar-plus" width={16} height={16} className="text-gray-500" />
                  {service.createdDate || '—'}
                </div>

                <div className="font-medium text-gray-700">Completed Date:</div>
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:calendar-check" width={16} height={16} className="text-green-500" />
                  <span className="text-green-600 font-medium">{service.completedDate || '—'}</span>
                </div>

                <div className="font-medium text-gray-700">Service ID:</div>
                <div className="font-mono text-xs">{service.id || '—'}</div>
              </div>
            </div>
          </TabsContent>

          {/* Problem Description Tab */}
          <TabsContent value="problem" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Problem Description</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {service.problemDescription || 'No problem description provided'}
              </div>
            </div>
          </TabsContent>

          {/* Diagnosis Tab */}
          <TabsContent value="diagnosis" className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Icon icon="mdi:stethoscope" className="h-5 w-5 text-blue-600" />
                Technician Diagnosis
              </h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {service.diagnosisNotes || 'No diagnosis notes available'}
              </div>
            </div>
          </TabsContent>

          {/* Parts Used Tab */}
          <TabsContent value="parts" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Icon icon="mdi:wrench-outline" className="h-5 w-5 text-gray-600" />
                Parts Used
              </h4>

              {service.diagnosedParts && service.diagnosedParts.length > 0 ? (
                <div className="space-y-3">
                  <div className="border rounded-md">
                    <div className="grid grid-cols-4 gap-4 p-3 bg-gray-100 font-medium text-sm">
                      <div>Part Name</div>
                      <div>Quantity</div>
                      <div>Unit Price</div>
                      <div>Subtotal</div>
                    </div>

                    {service.diagnosedParts.map((part, index) => (
                      <div key={index} className={`grid grid-cols-4 gap-4 p-3 text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <div className="font-medium">{part.part_name || 'Unknown Part'}</div>
                        <div>{part.quantity || 0}</div>
                        <div>₱{parseFloat(part.price || 0).toFixed(2)}</div>
                        <div className="font-medium">₱{(parseFloat(part.price || 0) * parseInt(part.quantity || 0)).toFixed(2)}</div>
                      </div>
                    ))}

                    <div className="p-3 bg-gray-100 border-t font-medium">
                      <div className="flex justify-between">
                        <span>Total Parts Cost:</span>
                        <span>₱{calculateTotalPartsCost()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <div className="text-center">
                    <Icon icon="mdi:package-variant" className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No parts were used for this service</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Attachment Tab */}
          <TabsContent value="attachment" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3 flex justify-between items-center">
                Attachment
              </h4>
              {service.originalRecord?.attachment ? (
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

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewServiceHistoryDialog;