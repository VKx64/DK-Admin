"use client";
import React, { useState, useEffect } from "react";
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { pb } from '@/lib/pocketbase';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const NewBranch = ({ open, onOpenChange, onCreated }) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('/Images/default_user.jpg');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (!open) {
      form.reset();
      setAvatarFile(null);
      setAvatarPreview('/Images/default_user.jpg');
      setError('');
    }
  }, [open, form]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');
    try {
      const userData = new FormData();
      userData.append('name', data.name);
      userData.append('email', data.email);
      userData.append('password', data.password);
      userData.append('passwordConfirm', data.confirmPassword);
      userData.append('role', 'admin');
      userData.append('emailVisibility', true);
      if (avatarFile) {
        userData.append('avatar', avatarFile);
      }
      await pb.collection('users').create(userData);
      if (onCreated) onCreated();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to create branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Register New Branch
          </DialogTitle>
          <DialogDescription>
            Enter the branch admin information below to create a new branch.
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
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium">Profile Picture</h3>
                <p className="text-sm text-gray-500">Click on the image to upload</p>
              </div>
            </div>
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid grid-cols-1 mb-4">
                <TabsTrigger value="account" className="flex items-center gap-1">
                  <Icon icon="mdi:account" className="h-4 w-4" /> Account
                </TabsTrigger>
              </TabsList>
              <TabsContent value="account" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Branch Admin Name" {...field} />
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
                        <Input type="email" placeholder="branch@example.com" {...field} />
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
                ) : 'Register Branch'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewBranch;