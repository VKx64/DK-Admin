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
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import pb from '@/services/pocketbase';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

/**
 * Form validation schema using Zod
 */
const formSchema = z.object({
  // User data
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
  role: z.string().default('technician'),

  // Technician details
  job_title: z.string().min(2, { message: 'Job title is required.' }),
  specialization: z.string().optional(),
  years_of_experience: z.string().transform(val => parseFloat(val) || 0).optional(),
  preferred_job_type: z.string().optional(),
  days_availability: z.string().transform(val => parseFloat(val) || 0).optional(),
  hours_availability: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

/**
 * NewTechnician - Component for creating new technician in a dialog
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onOpenChange - Function to call when dialog open state changes
 * @param {Function} props.onSuccess - Function to call when the technician is successfully created
 */
const NewTechnician = ({ open, onOpenChange, onSuccess }) => {
  // Form initialization using react-hook-form with zod validation
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'technician',
      job_title: '',
      specialization: '',
      years_of_experience: '',
      preferred_job_type: '',
      days_availability: '',
      hours_availability: '',
    }
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [resumePreview, setResumePreview] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('/Images/default_user.jpg');

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

  // Reset the form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setResumeFile(null);
      setAvatarFile(null);
      setResumePreview('');
      setAvatarPreview('/Images/default_user.jpg');
      setError('');
    }
  }, [open, form]);

  // Submit the form
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');

    try {
      // Create the user with basic information
      const userData = new FormData();
      userData.append('name', data.name);
      userData.append('email', data.email);
      userData.append('password', data.password);
      userData.append('passwordConfirm', data.confirmPassword);
      userData.append('role', 'technician');
      userData.append('emailVisibility', true); // Ensure email visibility is set to true

      // Add avatar file if it exists
      if (avatarFile) {
        userData.append('avatar', avatarFile);
      }

      // Create the user
      const newUser = await pb.collection('users').create(userData);

      // Create technician details
      const techData = new FormData();
      techData.append('job_title', data.job_title);
      techData.append('specialization', data.specialization || '');
      techData.append('years_of_experience', parseFloat(data.years_of_experience) || 0);
      techData.append('preferred_job_type', data.preferred_job_type || '');
      techData.append('days_availability', parseFloat(data.days_availability) || 0);
      techData.append('hours_availability', data.hours_availability || '');

      // Add resume file if it exists
      if (resumeFile) {
        techData.append('resume_image', resumeFile);
      }

      // Create the technician details
      const newTechDetails = await pb.collection('technician_details').create(techData);

      // Link technician details to user
      await pb.collection('users').update(newUser.id, {
        technician_details: newTechDetails.id
      });

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close dialog
      onOpenChange(false);

    } catch (err) {
      console.error('Error creating technician:', err);
      setError(err.message || 'Failed to create technician');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Register New Technician
          </DialogTitle>
          <DialogDescription>
            Enter the technician information below to create a new account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Icon icon="mdi:upload" className="h-6 w-6" />
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
                <p className="text-sm text-gray-500">Click on the image to upload</p>
              </div>
            </div>

            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="account" className="flex items-center gap-1">
                  <Icon icon="mdi:account" className="h-4 w-4" /> Account
                </TabsTrigger>
                <TabsTrigger value="technical" className="flex items-center gap-1">
                  <Icon icon="mdi:briefcase" className="h-4 w-4" /> Technical
                </TabsTrigger>
                <TabsTrigger value="availability" className="flex items-center gap-1">
                  <Icon icon="mdi:clock-outline" className="h-4 w-4" /> Availability
                </TabsTrigger>
              </TabsList>

              {/* Account Tab */}
              <TabsContent value="account" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resume Document Upload */}
                <div className="grid gap-2 mt-4">
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
                            <Icon icon="mdi:upload" className="h-4 w-4" /> Change Resume
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="resume-upload"
                        className="flex flex-col items-center justify-center h-32 gap-2 cursor-pointer text-gray-500"
                      >
                        <Icon icon="mdi:file-document-outline" className="h-10 w-10" />
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
              </TabsContent>

              {/* Technical Tab */}
              <TabsContent value="technical" className="space-y-4">
                <FormField
                  control={form.control}
                  name="job_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="HVAC Technician" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <FormControl>
                        <Input placeholder="Residential Air Conditioning" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="years_of_experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferred_job_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Job Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Installation / Maintenance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Availability Tab */}
              <TabsContent value="availability" className="space-y-4">
                <FormField
                  control={form.control}
                  name="days_availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Days Available per Week</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5"
                          min="0"
                          max="7"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hours_availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours Available per Day</FormLabel>
                      <FormControl>
                        <Input placeholder="9AM - 5PM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                    <Icon icon="mdi:loading" className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : 'Register Technician'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTechnician;