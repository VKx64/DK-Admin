"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import pb from "@/services/pocketbase";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Define the Zod schema (same as NewParts)
const formSchema = z.object({
  name: z.string().min(1, { message: "Part name is required." }),
  part_number: z.coerce.number().optional(),
  brand: z.string().optional(),
  price: z.string().optional(),
  description: z.string().optional(),
  stocks: z.coerce.number().optional(), // Keep for form state, but disable input
  reorder_threshold: z.coerce.number().optional(), // Add reorder threshold
});

const EditParts = ({ isOpen, onOpenChange, part, onPartUpdated }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      part_number: "",
      brand: "",
      price: "",
      description: "",
      stocks: "",
      reorder_threshold: "", // Add default value
    },
  });

  // Effect to populate form when part data is available and dialog opens
  useEffect(() => {
    if (part && isOpen) {
      form.reset({
        name: part.name || "",
        part_number: part.part_number || "",
        brand: part.brand || "",
        price: part.price || "",
        description: part.description || "",
        stocks: part.stocks || "",
        reorder_threshold: part.reorder_threshold || "", // Populate reorder threshold
      });

      // Set initial image preview
      const initialImageUrl = part.image
        ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${part.collectionId}/${part.id}/${part.image}`
        : "/Images/default_user.jpg";
      setImagePreviewUrl(initialImageUrl);
      setImageFile(null); // Reset file input state
    } else if (!isOpen) {
      // Optionally clear preview when dialog closes
      setImagePreviewUrl(null);
      setImageFile(null);
    }
  }, [part, isOpen, form.reset]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      // If user cancels file selection, revert to original image or default
      const originalImageUrl = part.image
        ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${part.collectionId}/${part.id}/${part.image}`
        : "/Images/default_user.jpg";
      setImagePreviewUrl(originalImageUrl);
      setImageFile(null);
    }
  };

  const onSubmit = async (values) => {
    if (!part) return; // Should not happen if dialog is open correctly

    setIsSubmitting(true);
    const formData = new FormData();

    // Append form values (excluding stocks)
    formData.append("name", values.name);
    if (
      values.part_number !== undefined &&
      values.part_number !== null &&
      values.part_number !== ""
    )
      formData.append("part_number", values.part_number);
    if (values.brand) formData.append("brand", values.brand);
    if (values.price) formData.append("price", values.price);
    if (values.description) formData.append("description", values.description);

    // Append reorder threshold
    if (
      values.reorder_threshold !== undefined &&
      values.reorder_threshold !== null &&
      values.reorder_threshold !== ""
    )
      formData.append("reorder_threshold", values.reorder_threshold);
    else {
      // Explicitly set to null or 0 if cleared, depending on DB preference
      formData.append("reorder_threshold", 0); // Or null, adjust as needed
    }

    // Append image file ONLY if a new one was selected
    if (imageFile) {
      formData.append("image", imageFile);
    } else if (values.image === null) {
      // If you want to allow REMOVING the image, uncomment the next line
      // formData.append("image", null);
    }
    // If imageFile is null and values.image is not null, the existing image remains untouched

    try {
      await pb.collection("parts").update(part.id, formData);
      toast.success("Part updated successfully!");
      onPartUpdated(); // Trigger refresh in parent
      onOpenChange(false); // Close the dialog
    } catch (error) {
      console.error("Failed to update part:", error);
      toast.error(`Failed to update part: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    // Reset preview and file state on close
    setImagePreviewUrl(null);
    setImageFile(null);
    onOpenChange(false);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Part</DialogTitle>
          <DialogDescription>
            Update the details for part: {part?.name || "N/A"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="edit-parts-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            {/* Image Preview and Upload - Centered */}
            <FormItem className="flex flex-col items-center col-span-2">
              <FormLabel>Part Image</FormLabel>
              <div
                className="h-32 w-32 relative rounded-md overflow-hidden border mb-2 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleImageClick}
              >
                <Image
                  src={imagePreviewUrl || "/Images/default_user.jpg"}
                  alt={part?.name || "Part image"}
                  fill
                  sizes="128px"
                  className="object-contain p-1"
                />
              </div>
              <FormControl>
                <Input
                  id="part-image-edit-input"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </FormControl>
              <FormDescription className="mt-1 text-xs">
                Click image to upload a new one (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>

            {/* Form Fields */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Part Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter part name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Combined Grid for Part Number, Brand, Price, Stocks, Reorder Threshold */}
            <div className="grid grid-cols-2 gap-4 col-span-2">
              <FormField
                control={form.control}
                name="part_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Number</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Daikin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 99.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stocks Field (Disabled) */}
              <FormField
                control={form.control}
                name="stocks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stocks (Read-only)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled />
                    </FormControl>
                    <FormDescription>Adjust via Stock Log.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reorder Threshold Field */}
              <FormField
                control={form.control}
                name="reorder_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Threshold</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a brief description of the part"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        {/* Divider and Footer outside the form grid */}
        <div className="border-t mt-4 pt-4">
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="edit-parts-form" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditParts;
