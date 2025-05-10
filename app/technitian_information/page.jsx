"use client";
import React, { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Upload, Save, CheckCircle, XCircle } from 'lucide-react';
import { Icon } from "@iconify/react";
import Image from 'next/image';

const TechnicianInformationPage = () => {
  // State for technician data
  const [technician, setTechnician] = useState(null);
  const [techDetails, setTechDetails] = useState(null);

  // State for editing mode
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    job_title: '',
    specialization: '',
    years_of_experience: '',
    preferred_job_type: '',
    days_availability: '',
    hours_availability: '',
  });

  // State for file uploads
  const [resumeFile, setResumeFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [resumePreview, setResumePreview] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');

  // Helper function to safely construct file URLs
  const getFileUrl = (collection, recordId, filename) => {
    const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';
    if (!baseUrl || !collection || !recordId || !filename) return '';
    return `${baseUrl}/api/files/${collection}/${recordId}/${filename}`;
  };

  // Fetch technician data
  useEffect(() => {
    const fetchTechnicianData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if user is authenticated
        if (!pb.authStore.isValid || !pb.authStore.model) {
          setError('You need to log in to view your information.');
          setIsLoading(false);
          return;
        }

        // Get current user ID
        const userId = pb.authStore.model.id;

        // Fetch user with expanded technician details
        const technicianData = await pb.collection('users').getOne(userId, {
          expand: 'technician_details',
          requestKey: null, // Prevent auto-cancellation of request
        });

        // Save technician data
        setTechnician(technicianData);
        setTechDetails(technicianData.expand?.technician_details || null);

        // Initialize form data
        setFormData({
          name: technicianData.name || '',
          email: technicianData.email || '',
          job_title: technicianData.expand?.technician_details?.job_title || '',
          specialization: technicianData.expand?.technician_details?.specialization || '',
          years_of_experience: technicianData.expand?.technician_details?.years_of_experience || '',
          preferred_job_type: technicianData.expand?.technician_details?.preferred_job_type || '',
          days_availability: technicianData.expand?.technician_details?.days_availability || '',
          hours_availability: technicianData.expand?.technician_details?.hours_availability || '',
        });

        // Set image previews
        if (technicianData.avatar) {
          setAvatarPreview(getFileUrl('users', technicianData.id, technicianData.avatar));
        } else {
          setAvatarPreview('/Images/default_user.jpg');
        }

        if (technicianData.expand?.technician_details?.resume_image) {
          setResumePreview(getFileUrl(
            'technician_details',
            technicianData.expand.technician_details.id,
            technicianData.expand.technician_details.resume_image
          ));
        } else {
          setResumePreview('');
        }

      } catch (err) {
        console.error('Error fetching technician data:', err);
        setError(`Failed to load your information: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTechnicianData();
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);

    // Reset form data when entering edit mode
    if (!isEditing && technician) {
      setFormData({
        name: technician.name || '',
        email: technician.email || '',
        job_title: techDetails?.job_title || '',
        specialization: techDetails?.specialization || '',
        years_of_experience: techDetails?.years_of_experience || '',
        preferred_job_type: techDetails?.preferred_job_type || '',
        days_availability: techDetails?.days_availability || '',
        hours_availability: techDetails?.hours_availability || '',
      });

      // Reset file states but keep the previews
      setResumeFile(null);
      setAvatarFile(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      if (!technician) {
        throw new Error('User data not found');
      }

      // Update user data
      const userData = {
        name: formData.name,
        email: formData.email,
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
        await pb.collection('users').update(technician.id, formDataWithAvatar, {
          requestKey: null, // Prevent auto-cancellation of request
        });
      } else {
        // Update user without avatar
        await pb.collection('users').update(technician.id, userData, {
          requestKey: null, // Prevent auto-cancellation of request
        });
      }

      // Update technician details
      const techData = {
        job_title: formData.job_title,
        specialization: formData.specialization,
        years_of_experience: parseFloat(formData.years_of_experience) || 0,
        preferred_job_type: formData.preferred_job_type,
        days_availability: parseFloat(formData.days_availability) || 0,
        hours_availability: formData.hours_availability,
      };

      if (techDetails) {
        // Update existing technician details
        if (resumeFile) {
          const techFormData = new FormData();

          // Add basic fields
          for (const [key, value] of Object.entries(techData)) {
            techFormData.append(key, value);
          }

          // Add resume file
          techFormData.append('resume_image', resumeFile);

          // Update technician details with resume
          await pb.collection('technician_details').update(techDetails.id, techFormData, {
            requestKey: null, // Prevent auto-cancellation of request
          });
        } else {
          // Update technician details without resume
          await pb.collection('technician_details').update(techDetails.id, techData, {
            requestKey: null, // Prevent auto-cancellation of request
          });
        }
      } else {
        // Create new technician details record
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
        const newTechDetails = await pb.collection('technician_details').create(techFormData, {
          requestKey: null, // Prevent auto-cancellation of request
        });

        // Link technician details to user
        await pb.collection('users').update(technician.id, {
          technician_details: newTechDetails.id
        }, {
          requestKey: null, // Prevent auto-cancellation of request
        });
      }

      // Refresh technician data
      const updatedTechnician = await pb.collection('users').getOne(technician.id, {
        expand: 'technician_details',
        requestKey: null, // Prevent auto-cancellation of request
      });

      // Update state with new data
      setTechnician(updatedTechnician);
      setTechDetails(updatedTechnician.expand?.technician_details || null);

      // Exit edit mode
      setIsEditing(false);
      setSuccessMessage('Your information has been successfully updated!');

      // Clear the success message after a delay
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);

    } catch (err) {
      console.error('Error updating technician:', err);
      setError(`Failed to update your information: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Format dates for created and updated fields
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading your information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !technician) {
    return (
      <div className="h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-6 max-w-lg text-center">
          <h2 className="font-semibold text-lg mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex-1 flex flex-col bg-[#EAEFF8] overflow-hidden">
      {/* Header - styled like Header.jsx - fixed at top */}
      <div className="w-full bg-white shadow-sm p-4 rounded-sm flex flex-row justify-between flex-shrink-0">
        {/* Header Text and Icon */}
        <div className="flex flex-row gap-3 items-center w-fit">
          <Icon
            icon="mdi:account-details"
            className="text-4xl text-[#1E1E1E]"
          />
          <h1 className="font-raleway font-semibold text-2xl text-[#1E1E1E]">
            My Technician Profile
          </h1>
        </div>

        {/* Action Button */}
        <div className="flex flex-row gap-3">
          <Button
            size={"lg"}
            variant={isEditing ? "outline" : "default"}
            className={isEditing ? "border-gray-300" : "bg-blue-600 hover:bg-blue-700"}
            onClick={toggleEditMode}
          >
            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
        {/* Success message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-center">
            <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Profile</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  {isEditing ? (
                    <div className="relative h-28 w-28 group">
                      <div className="rounded-full overflow-hidden h-28 w-28 border-2 border-gray-200">
                        <Image
                          src={avatarPreview}
                          alt="Profile"
                          width={112}
                          height={112}
                          className="object-cover h-full w-full"
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <label htmlFor="avatar-upload" className="cursor-pointer text-white">
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
                  ) : (
                    <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-gray-200">
                      <Image
                        src={avatarPreview}
                        alt="Profile"
                        width={112}
                        height={112}
                        className="object-cover h-full w-full"
                      />
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="font-medium text-lg">{technician?.name || "Unnamed Technician"}</h3>
                    <p className="text-gray-500 text-sm">{technician?.email}</p>
                  </div>

                  <Badge variant="outline" className="px-3 py-1">
                    {technician?.role || "technician"}
                  </Badge>
                </div>

                {!isEditing && (
                  <div className="mt-5 text-sm space-y-2 border-t border-gray-100 pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Member since</span>
                      <span>{formatDate(technician?.created)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last updated</span>
                      <span>{formatDate(technician?.updated)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Verified</span>
                      {technician?.verified ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Yes
                        </span>
                      ) : (
                        <span className="text-amber-600 flex items-center">
                          <XCircle className="h-3.5 w-3.5 mr-1" /> No
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit}>
              <Card className="shadow-sm mb-6">
                <CardHeader className="border-b pb-3">
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Your profile and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Your full name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your.email@example.com"
                          />
                        </div>
                      </div>

                      {/* Resume Upload */}
                      <div className="space-y-2 mt-5">
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
                              <Upload className="h-10 w-10" />
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
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase">Full Name</Label>
                          <p className="text-sm mt-1">{technician?.name || "—"}</p>
                        </div>

                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase">Email Address</Label>
                          <p className="text-sm mt-1">{technician?.email || "—"}</p>
                        </div>
                      </div>

                      {/* Resume Display */}
                      <div className="mt-5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase mb-2">Resume Document</Label>
                        {resumePreview ? (
                          <div className="relative w-full h-0 pb-[30%] rounded-md overflow-hidden border border-gray-200">
                            <Image
                              src={resumePreview}
                              alt="Resume"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <a
                                href={resumePreview}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white bg-black bg-opacity-50 px-3 py-1.5 rounded-md flex items-center gap-1"
                              >
                                <User className="h-4 w-4" /> View Resume
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-full h-32 bg-gray-100 rounded-md">
                            <div className="flex flex-col items-center text-gray-500">
                              <User className="h-10 w-10 mb-2" />
                              <span>No resume uploaded</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm mb-6">
                <CardHeader className="border-b pb-3">
                  <CardTitle>Professional Details</CardTitle>
                  <CardDescription>
                    Your technical expertise and experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {isEditing ? (
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="job_title">Job Title</Label>
                        <Input
                          id="job_title"
                          name="job_title"
                          value={formData.job_title}
                          onChange={handleChange}
                          placeholder="HVAC Technician"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="specialization">Specialization</Label>
                        <Input
                          id="specialization"
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleChange}
                          placeholder="Residential Air Conditioning"
                        />
                      </div>

                      <div className="space-y-2">
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

                      <div className="space-y-2">
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
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase">Job Title</Label>
                        <p className="text-sm mt-1">{techDetails?.job_title || "—"}</p>
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase">Specialization</Label>
                        <p className="text-sm mt-1">{techDetails?.specialization || "—"}</p>
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase">Years of Experience</Label>
                        <p className="text-sm mt-1">{techDetails?.years_of_experience ? `${techDetails.years_of_experience} years` : "—"}</p>
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase">Preferred Job Type</Label>
                        <p className="text-sm mt-1">{techDetails?.preferred_job_type || "—"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="border-b pb-3">
                  <CardTitle>Availability Information</CardTitle>
                  <CardDescription>
                    Your work schedule and availability
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {isEditing ? (
                    <div className="grid gap-4">
                      <div className="space-y-2">
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

                      <div className="space-y-2">
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
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase">Days Available per Week</Label>
                        <p className="text-sm mt-1">{techDetails?.days_availability ? `${techDetails.days_availability} days` : "—"}</p>
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase">Hours Available per Day</Label>
                        <p className="text-sm mt-1">{techDetails?.hours_availability || "—"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                {isEditing && (
                  <CardFooter className="flex justify-end gap-3 border-t p-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={toggleEditMode}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="gap-1"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianInformationPage;