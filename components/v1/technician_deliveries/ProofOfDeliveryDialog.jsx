"use client";
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CameraIcon, UploadIcon, XIcon } from "lucide-react";
import { submitDeliveryProof } from '@/services/pocketbase/assignTechnician';
import { toast } from 'sonner';

const ProofOfDeliveryDialog = ({ open, onOpenChange, order, onSuccess }) => {
  const [proofImage, setProofImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setProofImage(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Clear image
  const handleClearImage = () => {
    setProofImage(null);
    setPreviewUrl(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!proofImage) {
      toast.error('Please upload a proof of delivery image');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitDeliveryProof(order.id, proofImage, notes);
      toast.success('Delivery completed successfully!');

      // Reset form
      setProofImage(null);
      setPreviewUrl(null);
      setNotes('');

      // Close dialog and refresh
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting delivery proof:', error);
      toast.error(`Failed to submit delivery proof: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen) => {
    if (!newOpen && !isSubmitting) {
      setProofImage(null);
      setPreviewUrl(null);
      setNotes('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Delivery</DialogTitle>
          <DialogDescription>
            Upload a photo as proof of delivery for order #{order?.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Info */}
          <div className="bg-blue-50 p-3 rounded-md text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-medium">{order?.expand?.address?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Date:</span>
              <span>{new Date(order?.created).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="proof-image">
              Proof of Delivery Image <span className="text-red-500">*</span>
            </Label>

            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Proof preview"
                  className="w-full h-64 object-cover rounded-md border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleClearImage}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  id="proof-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="proof-image"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <CameraIcon className="h-12 w-12 text-gray-400 mb-3" />
                  <span className="text-sm font-medium text-gray-700 mb-1">
                    Click to upload image
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG, WEBP up to 5MB
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="delivery-notes">Delivery Notes (Optional)</Label>
            <Textarea
              id="delivery-notes"
              placeholder="Add any notes about the delivery..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {notes.length}/1000 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!proofImage || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <UploadIcon className="h-4 w-4 mr-2" />
                Complete Delivery
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProofOfDeliveryDialog;
