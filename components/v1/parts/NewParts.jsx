"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import pb from "@/services/pocketbase";

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

// Define the Zod schema for validation
const formSchema = z.object({
  name: z.string().min(1, { message: "Part name is required." }),
  part_number: z.coerce.number().optional(), // Use coerce for number conversion
  brand: z.string().optional(),
  price: z.string().optional(), // Keep price as string based on schema
  description: z.string().optional(),
  stocks: z.coerce.number().optional(), // Use coerce for number conversion
  reorder_threshold: z.coerce.number().optional(), // Add reorder threshold
});

const NewParts = ({ isOpen, onOpenChange, onPartCreated }) => {
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleFileChange = (event) => {
    setImageFile(event.target.files[0]);
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    const formData = new FormData();

    // Append form values
    formData.append("name", values.name);
    if (values.part_number) formData.append("part_number", values.part_number);
    if (values.brand) formData.append("brand", values.brand);
    if (values.price) formData.append("price", values.price);
    if (values.description) formData.append("description", values.description);
    if (values.stocks) formData.append("stocks", values.stocks);
    if (values.reorder_threshold) formData.append("reorder_threshold", values.reorder_threshold); // Append reorder threshold

    // Append image file if selected
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      await pb.collection("parts").create(formData);
      toast.success("Part created successfully!");
      form.reset(); // Reset form fields
      setImageFile(null); // Clear image file state
      if (document.getElementById('part-image-input')) {
        document.getElementById('part-image-input').value = ''; // Clear file input visually
      }
      onPartCreated(); // Trigger refresh in parent
      onOpenChange(false); // Close the dialog
    } catch (error) {
      console.error("Failed to create part:", error);
      toast.error(`Failed to create part: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    form.reset();
    setImageFile(null);
     if (document.getElementById('part-image-input')) {
        document.getElementById('part-image-input').value = ''; // Clear file input visually
      }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Part</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new part to the inventory.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Part Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter part name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 99.99" {...field} />
                    </FormControl>
                     <FormDescription>Enter price as text (e.g., "150.00").</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stocks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stocks</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a brief description of the part"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Image</FormLabel>
              <FormControl>
                <Input id="part-image-input" type="file" onChange={handleFileChange} accept="image/*" />
              </FormControl>
              <FormDescription>
                Upload an image for the part (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Part"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewParts;
