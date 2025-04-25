"use client";
import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { FileText, CheckCircle, XCircle, User, Calendar, Briefcase, Clock, Upload, Loader2 } from 'lucide-react';
import { pb } from '@/lib/pocketbase';

/**
 * EditTechnician - Component for editing technician information in a dialog
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onOpenChange - Function to call when dialog open state changes
 * @param {Object} props.technician - The technician data to edit
 * @param {Function} props.onSuccess - Function to call when the technician is successfully updated
 */
const EditTechnician = ({ open, onOpenChange, technician, onSuccess }) => {
  // Return null if no technician data is provided
  if (!technician) return null;

  // Form state
  const [formData, setFormData] = useState({
    // User data
    name: '',
    email: '',
    role: 'technician',
    verified: false,

    // Technician details
    job_title: '',
    specialization: '',
    years_of_experience: '',
    preferred_job_type: '',
    days_availability: '',
    hours_availability: '',
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [resumePreview, setResumePreview] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');

  // Helper function to safely construct file URLs from PocketBase
  const getFileUrl = (collection, recordId, filename) => {
    const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';
    if (!baseUrl || !collection || !recordId || !filename) return '';
    return `${baseUrl}/api/files/${collection}/${recordId}/${filename}`;
  };

  // Initialize form data when technician data changes
  useEffect(() => {
    if (technician) {
      // Get technician details from expanded relation
      const techDetails = technician.expand?.technician_details || {};

      // Set form data
      setFormData({
        name: technician.name || '',
        email: technician.email || '',
        role: technician.role || 'technician',
        verified: technician.verified || false,

        job_title: techDetails.job_title || '',
        specialization: techDetails.specialization || '',
        years_of_experience: techDetails.years_of_experience || '',
        preferred_job_type: techDetails.preferred_job_type || '',
        days_availability: techDetails.days_availability || '',
        hours_availability: techDetails.hours_availability || '',
      });

      // Set file previews
      if (technician.avatar) {
        setAvatarPreview(getFileUrl('users', technician.id, technician.avatar));
      } else {
        setAvatarPreview('/Images/default_user.jpg');
      }

      if (techDetails.resume_image) {
        setResumePreview(getFileUrl('technician_details', techDetails.id, techDetails.resume_image));
      } else {
        setResumePreview('');
      }
    }
  }, [technician]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle file changes
  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    if (fileType === 'resume') {
      setResumeFile(file);
      setResumePreview(previewUrl);
    } else if (fileType === 'avatar') {
      setAvatarFile(file);
      setAvatarPreview(previewUrl);
    }
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Get technician details ID
      const techDetailsId = technician.expand?.technician_details?.id;

      // Update user data
      const userData = {
        name: formData.name,
        email: formData.email,
        verified: formData.verified,
        role: 'technician', // Ensure role stays as technician
      };

      // Create FormData for file uploads if needed
      if (avatarFile) {
        const formDataWithAvatar = new FormData();

        // Add basic fields
        for (const [key, value] of Object.entries(userData)) {
          formDataWithAvatar.append(key, value);
        }

        // Add avatar file
        formDataWithAvatar.append('avatar', avatarFile);

        // Update user with avatar
        await pb.collection('users').update(technician.id, formDataWithAvatar);
      } else {
        // Update user without avatar
        await pb.collection('users').update(technician.id, userData);
      }

      // Update technician details if they exist
      if (techDetailsId) {
        const techData = {
          job_title: formData.job_title,
          specialization: formData.specialization,
          years_of_experience: parseFloat(formData.years_of_experience) || 0,
          preferred_job_type: formData.preferred_job_type,
          days_availability: parseFloat(formData.days_availability) || 0,
          hours_availability: formData.hours_availability,
        };

        // Create FormData for resume file upload if needed
        if (resumeFile) {
          const techFormData = new FormData();

          // Add basic fields
          for (const [key, value] of Object.entries(techData)) {
            techFormData.append(key, value);
          }

          // Add resume file
          techFormData.append('resume_image', resumeFile);

          // Update technician details with resume
          await pb.collection('technician_details').update(techDetailsId, techFormData);
        } else {
          // Update technician details without resume
          await pb.collection('technician_details').update(techDetailsId, techData);
        }
      } else {
        // Create new technician details record if it doesn't exist
        const techData = {
          job_title: formData.job_title,
          specialization: formData.specialization,
          years_of_experience: parseFloat(formData.years_of_experience) || 0,
          preferred_job_type: formData.preferred_job_type,
          days_availability: parseFloat(formData.days_availability) || 0,
          hours_availability: formData.hours_availability,
        };

        // Create FormData for resume file upload if needed
        const techFormData = new FormData();

        // Add basic fields
        for (const [key, value] of Object.entries(techData)) {
          techFormData.append(key, value);
        }

        // Add resume file if it exists
        if (resumeFile) {
          techFormData.append('resume_image', resumeFile);
        }

        // Create new technician details
        const newTechDetails = await pb.collection('technician_details').create(techFormData);

        // Link technician details to user
        await pb.collection('users').update(technician.id, {
          technician_details: newTechDetails.id
        });
      }

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close dialog
      onOpenChange(false);

    } catch (err) {
      console.error('Error updating technician:', err);
      setError(err.message || 'Failed to update technician');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Technician
          </DialogTitle>
          <DialogDescription>
            Update the technician information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Avatar upload */}
          <div className="flex items-center gap-4 pb-4">
            <div className="h-16 w-16 relative rounded-full overflow-hidden border-2 border-gray-200 group">
              <Image
                src={avatarPreview}
                alt="Avatar"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer text-white"
                >
                  <Upload className="h-6 w-6" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'avatar')}
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium">Profile Picture</h3>
              <p className="text-sm text-gray-500">Click on the image to change</p>
            </div>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="profile" className="flex items-center gap-1">
                <User className="h-4 w-4" /> Profile
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" /> Technical
              </TabsTrigger>
              <TabsTrigger value="availability" className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> Availability
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

                {/* Resume Document Upload */}
                <div className="grid gap-2">
                  <Label htmlFor="resume">Resume Document</Label>
                  <div className="border border-gray-200 rounded-md p-4">
                    {resumePreview ? (
                      <div className="relative w-full h-0 pb-[50%] rounded-md overflow-hidden">
                        <Image
                          src={resumePreview}
                          alt="Resume"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <label
                            htmlFor="resume-upload"
                            className="cursor-pointer text-white bg-black bg-opacity-50 px-3 py-1.5 rounded-md flex items-center gap-1"
                          >
                            <Upload className="h-4 w-4" /> Change Resume
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="resume-upload"
                        className="flex flex-col items-center justify-center h-32 gap-2 cursor-pointer text-gray-500"
                      >
                        <FileText className="h-10 w-10" />
                        <span>Click to upload resume</span>
                      </label>
                    )}
                    <input
                      id="resume-upload"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'resume')}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Technical Tab */}
            <TabsContent value="technical" className="space-y-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleChange}
                    placeholder="HVAC Technician"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="Residential Air Conditioning"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="years_of_experience">Years of Experience</Label>
                  <Input
                    id="years_of_experience"
                    name="years_of_experience"
                    type="number"
                    value={formData.years_of_experience}
                    onChange={handleChange}
                    placeholder="5"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="preferred_job_type">Preferred Job Type</Label>
                  <Input
                    id="preferred_job_type"
                    name="preferred_job_type"
                    value={formData.preferred_job_type}
                    onChange={handleChange}
                    placeholder="Installation / Maintenance"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability" className="space-y-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="days_availability">Days Available per Week</Label>
                  <Input
                    id="days_availability"
                    name="days_availability"
                    type="number"
                    max="7"
                    min="0"
                    value={formData.days_availability}
                    onChange={handleChange}
                    placeholder="5"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="hours_availability">Hours Available per Day</Label>
                  <Input
                    id="hours_availability"
                    name="hours_availability"
                    value={formData.hours_availability}
                    onChange={handleChange}
                    placeholder="9AM - 5PM"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mt-4 text-sm">
              {error}
            </div>
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTechnician;