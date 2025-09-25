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
import { Label } from "@/components/ui/label";

const ViewParts = ({ isOpen, onOpenChange, part }) => {
  if (!part) return null;

  const imageUrl = part.image
    ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${part.collectionId}/${part.id}/${part.image}`
    : "/Images/default_user.jpg";

  const formattedPrice = part.price ? new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(part.price) : "N/A";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg"> {/* Increased width slightly */}
        <DialogHeader>
          <DialogTitle>Part Details</DialogTitle>
          <DialogDescription>
            Viewing details for part: {part.name || "N/A"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4"> {/* Increased gap */}
          {/* Image Section */}
          <div className="flex justify-center">
            <div className="h-48 w-48 relative rounded-lg overflow-hidden border shadow-sm"> {/* Larger image, rounded, shadow */}
              <Image
                src={imageUrl}
                alt={part.name || "Part image"}
                fill
                sizes="192px" // Corresponds to h-48 w-48
                className="object-contain p-2" // Added padding within the container
                priority
              />
            </div>
          </div>

          {/* Details Grid Section */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4"> {/* Adjusted gaps */}
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="part-name" className="text-xs font-medium text-muted-foreground uppercase">Name</Label>
                <p id="part-name" className="text-sm font-semibold mt-1">{part.name || "N/A"}</p>
              </div>
              <div>
                <Label htmlFor="part-brand" className="text-xs font-medium text-muted-foreground uppercase">Brand</Label>
                <p id="part-brand" className="text-sm mt-1">{part.brand || "N/A"}</p>
              </div>
              <div>
                <Label htmlFor="part-stocks" className="text-xs font-medium text-muted-foreground uppercase">Current Stock</Label>
                <p
                  id="part-stocks"
                  className={`text-sm mt-1 ${part.reorder_threshold !== null && part.reorder_threshold !== undefined && part.stocks <= part.reorder_threshold ? 'text-red-600 font-semibold' : ''}`}
                >
                  {part.stocks ?? "N/A"}
                </p>
              </div>
              <div>
                <Label htmlFor="part-reorder-threshold" className="text-xs font-medium text-muted-foreground uppercase">Reorder Threshold</Label>
                <p id="part-reorder-threshold" className="text-sm mt-1">
                  {part.reorder_threshold !== null && part.reorder_threshold !== undefined ? part.reorder_threshold : "N/A"}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="part-number" className="text-xs font-medium text-muted-foreground uppercase">Part Number</Label>
                <p id="part-number" className="text-sm mt-1">{part.part_number || "N/A"}</p>
              </div>
              <div>
                <Label htmlFor="part-price" className="text-xs font-medium text-muted-foreground uppercase">Price</Label>
                <p id="part-price" className="text-sm font-semibold mt-1">{formattedPrice}</p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="col-span-2"> {/* Ensure description spans full width if needed, though it's outside the grid now */}
            <Label htmlFor="part-description" className="text-xs font-medium text-muted-foreground uppercase">Description</Label>
            <p id="part-description" className="text-sm mt-1 whitespace-pre-wrap text-muted-foreground">{part.description || "N/A"}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t mt-6 pt-4"> {/* Added divider with margin and padding */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewParts;
