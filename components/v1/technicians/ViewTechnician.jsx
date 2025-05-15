"use client";
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { Icon } from '@iconify/react';

/**
 * ViewTechnician - Component for displaying detailed technician information in a dialog with tabs
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onOpenChange - Function to call when dialog open state changes
 * @param {Object} props.technician - The technician data to display
 */
const ViewTechnician = ({ open, onOpenChange, technician }) => {
  // Return null if no technician data is provided
  if (!technician) return null;

  // Get technician details from expanded relation
  const techDetails = technician.expand?.technician_details || {};

  // Helper function to safely construct file URLs
  const getFileUrl = (collection, recordId, filename) => {
    const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';
    if (!baseUrl || !collection || !recordId || !filename) return '';
    return `${baseUrl}/api/files/${collection}/${recordId}/${filename}`;
  };

  // Get avatar and resume URLs if they exist
  const avatarUrl = technician.avatar
    ? getFileUrl('users', technician.id, technician.avatar)
    : '/Images/default_user.jpg';

  const resumeImageUrl = techDetails.resume_image
    ? getFileUrl('technician_details', techDetails.id, techDetails.resume_image)
    : '';

  // Format dates for created and updated fields
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
  };

  // Handle opening resume image in new tab
  const openResumeInNewTab = () => {
    if (resumeImageUrl) {
      window.open(resumeImageUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            Technician Details
          </DialogTitle>
          <DialogDescription>
            Complete information about the technician
          </DialogDescription>
        </DialogHeader>

        {/* Technician header with avatar */}
        <div className="flex items-center gap-4 pb-4">
          <div className="h-16 w-16 relative rounded-full overflow-hidden border-2 border-gray-200">
            <Image
              src={avatarUrl}
              alt={technician.name || "Technician"}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium">{technician.name || "Unnamed Technician"}</h3>
            <p className="text-sm text-gray-500">{technician.email}</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <Icon icon="mdi:account" className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center gap-1">
              <Icon icon="mdi:briefcase" className="h-4 w-4" /> Technical
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center gap-1">
              <Icon icon="mdi:clock-outline" className="h-4 w-4" /> Availability
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
                <div>{technician.name || '—'}</div>

                <div className="font-medium text-gray-700">Email:</div>
                <div>{technician.email || '—'}</div>

                <div className="font-medium text-gray-700">Role:</div>
                <div className="capitalize">{technician.role || '—'}</div>
              </div>
            </div>

            {/* Resume Document - Full width with 4:2 ratio */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3 flex justify-between items-center">
                Resume Document
              </h4>
              {resumeImageUrl ? (
                <div
                  className="cursor-pointer"
                  onClick={openResumeInNewTab}
                >
                  <div className="relative w-full h-0 pb-[50%] rounded-md overflow-hidden">
                    <Image
                      src={resumeImageUrl}
                      alt="Resume"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white bg-black bg-opacity-50 px-2 py-2 rounded text-sm flex items-center gap-1">
                        <Icon icon="mdi:open-in-new" className="h-3.5 w-3.5" /> Click to open resume
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-32 bg-gray-100 rounded-md">
                  <div className="flex flex-col items-center text-gray-500">
                    <Icon icon="mdi:file-document-outline" className="h-10 w-10 mb-2" />
                    <span>No resume uploaded</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Professional Details</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="font-medium text-gray-700">Job Title:</div>
                <div>{techDetails.job_title || '—'}</div>

                <div className="font-medium text-gray-700">Specialization:</div>
                <div>{techDetails.specialization || '—'}</div>

                <div className="font-medium text-gray-700">Years of Experience:</div>
                <div>{techDetails.years_of_experience ? `${techDetails.years_of_experience} years` : '—'}</div>

                <div className="font-medium text-gray-700">Preferred Job Type:</div>
                <div>{techDetails.preferred_job_type || '—'}</div>
              </div>
            </div>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Work Schedule</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="font-medium text-gray-700">Days Available per Week:</div>
                <div>{techDetails.days_availability ? `${techDetails.days_availability} days` : '—'}</div>

                <div className="font-medium text-gray-700">Hours Available per Day:</div>
                <div>{techDetails.hours_availability || '—'}</div>
              </div>
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Account Information</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="font-medium text-gray-700">Account ID:</div>
                <div className="font-mono text-xs">{technician.id || '—'}</div>

                <div className="font-medium text-gray-700">Account Created:</div>
                <div>{formatDate(technician.created)}</div>

                <div className="font-medium text-gray-700">Last Updated:</div>
                <div>{formatDate(technician.updated)}</div>

                <div className="font-medium text-gray-700">Verified:</div>
                <div className="flex items-center">
                  {technician.verified ? (
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

export default ViewTechnician;