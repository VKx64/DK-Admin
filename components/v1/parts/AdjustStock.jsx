"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import pb from '@/services/pocketbase';

const AdjustStock = ({ isOpen, onOpenChange, part, onStockAdjusted }) => {
  const [changeQuantity, setChangeQuantity] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceRequests, setServiceRequests] = useState([]); // State for service requests
  const [selectedServiceRequestId, setSelectedServiceRequestId] = useState(''); // State for selected service request

  // Fetch active service requests when dialog opens
  useEffect(() => {
    const fetchServiceRequests = async () => {
      if (isOpen) {
        try {
          // Fetch requests that are 'scheduled' or 'in_progress'
          const filter = `status = "scheduled" || status = "in_progress"`;
          const resultList = await pb.collection('service_request').getFullList({
            filter: filter,
            sort: '-created', // Optional: sort by creation date
          });
          setServiceRequests(resultList);
        } catch (fetchError) {
          console.error('Error fetching service requests:', fetchError);
          toast.error('Failed to load service requests.');
          setServiceRequests([]); // Ensure it's an empty array on error
        }
      }
    };

    fetchServiceRequests();
  }, [isOpen]);

  // Reset form when dialog opens or part changes
  useEffect(() => {
    if (isOpen) {
      setChangeQuantity('');
      setType('');
      setNotes('');
      setSelectedServiceRequestId(''); // Reset selected service request
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, part]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const quantity = parseInt(changeQuantity, 10);

    // Basic Validation
    if (isNaN(quantity)) {
      setError('Change quantity must be a valid number.');
      setIsLoading(false);
      return;
    }
    if (!type) {
      setError('Please select an adjustment type.');
      setIsLoading(false);
      return;
    }
    // Add validation for service request if type is 'Usage'
    if (type === 'Usage' && !selectedServiceRequestId) {
      setError('Please select a related service request for "Usage" type.');
      setIsLoading(false);
      return;
    }
    if (!part || !part.id) {
      setError('Part information is missing.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Create log entry
      const logData = {
        part: part.id,
        change_quantity: quantity,
        type: type,
        notes: notes,
      };
      // Conditionally add related_service
      if (type === 'Usage' && selectedServiceRequestId) {
        logData.related_service = selectedServiceRequestId;
      }
      await pb.collection('part_stock_log').create(logData);

      // 2. Fetch current stock
      const currentPartData = await pb.collection('parts').getOne(part.id, {
        fields: 'stocks', // Only fetch the stocks field
      });
      const currentStock = currentPartData.stocks || 0; // Default to 0 if null/undefined

      // 3. Calculate new stock
      const newStock = currentStock + quantity;

      // Ensure stock doesn't go below zero if the change is negative
      if (newStock < 0) {
        setError(`Cannot adjust stock below zero. Current stock: ${currentStock}, Change: ${quantity}`);
        setIsLoading(false);
        return;
      }

      // 4. Update part stock
      await pb.collection('parts').update(part.id, { stocks: newStock });

      // 5. Success feedback and cleanup
      toast.success(`Stock for ${part.name} adjusted successfully.`);
      if (onStockAdjusted) {
        onStockAdjusted(); // Trigger refresh in parent
      }
      onOpenChange(false); // Close dialog
    } catch (err) {
      console.error('Error adjusting stock:', err);
      let errorMessage = 'An error occurred while adjusting stock.';
      if (err.response && err.response.message) {
        errorMessage = err.response.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast.error(`Failed to adjust stock: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!part) return null; // Don't render if no part is selected

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock for {part.name}</DialogTitle>
          <DialogDescription>
            Current Stock: {part.stocks ?? 'N/A'}. Enter the quantity to add or remove. Use negative numbers to decrease stock.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="change-quantity" className="text-right col-span-1">
              Change
            </Label>
            <Input
              id="change-quantity"
              type="number"
              value={changeQuantity}
              onChange={(e) => setChangeQuantity(e.target.value)}
              placeholder="e.g., 10 or -5"
              className="col-span-3"
              required
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right col-span-1">
              Type
            </Label>
            <Select
              value={type}
              onValueChange={setType}
              required
              disabled={isLoading}
            >
              <SelectTrigger id="type" className="col-span-3">
                <SelectValue placeholder="Select adjustment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Usage">Usage</SelectItem>
                <SelectItem value="Replenishment">Replenishment</SelectItem>
                <SelectItem value="Initial Stock">Initial Stock</SelectItem>
                <SelectItem value="Manual Adjustment">Manual Adjustment</SelectItem>
                <SelectItem value="Correction">Correction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Conditionally render Service Request Dropdown */}
          {type === 'Usage' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service-request" className="text-right col-span-1">
                Service Req.
              </Label>
              <Select
                value={selectedServiceRequestId}
                onValueChange={setSelectedServiceRequestId}
                required={type === 'Usage'} // Make required only if type is Usage
                disabled={isLoading || serviceRequests.length === 0}
              >
                <SelectTrigger id="service-request" className="col-span-3">
                  <SelectValue placeholder={serviceRequests.length > 0 ? "Select related service" : "No active services"} />
                </SelectTrigger>
                <SelectContent>
                  {serviceRequests.length > 0 ? (
                    serviceRequests.map((req) => (
                      <SelectItem key={req.id} value={req.id}>
                        {`ID: ${req.id.substring(0, 5)}... - ${req.product || 'N/A'} (${req.problem || 'No problem desc.'})`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No active service requests found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right col-span-1 self-start pt-2">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional: Reason for adjustment (e.g., Service ID, Stocktake)"
              className="col-span-3 min-h-[80px]"
              disabled={isLoading}
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Adjusting...' : 'Adjust Stock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdjustStock;
