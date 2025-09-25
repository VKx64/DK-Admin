"use client";

import React, { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@iconify/react";
import pb from "@/services/pocketbase";
import { toast } from "sonner";

const DiagnoseServiceDialog = ({ isOpen, onOpenChange, service, onDiagnosisComplete }) => {
  const [selectedParts, setSelectedParts] = useState([]);
  const [availableParts, setAvailableParts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosisNotes, setDiagnosisNotes] = useState("");

  // State for adding new part
  const [selectedPartId, setSelectedPartId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Fetch available parts when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableParts();
    }
  }, [isOpen]);

  const fetchAvailableParts = async () => {
    setIsLoading(true);
    try {
      const parts = await pb.collection('parts').getFullList({
        sort: 'name',
        filter: 'stocks > 0' // Only show parts with stock
      });
      setAvailableParts(parts);
    } catch (error) {
      console.error('Error fetching parts:', error);
      toast.error('Failed to load parts inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const addPartToSelection = () => {
    if (!selectedPartId || selectedQuantity <= 0) {
      toast.error('Please select a part and valid quantity');
      return;
    }

    const part = availableParts.find(p => p.id === selectedPartId);
    if (!part) return;

    if (selectedQuantity > part.stocks) {
      toast.error('Not enough stock available');
      return;
    }

    // Check if part is already selected
    const existingPart = selectedParts.find(p => p.id === selectedPartId);
    if (existingPart) {
      toast.error('Part already selected');
      return;
    }

    setSelectedParts(prev => [...prev, {
      id: part.id,
      name: part.name,
      quantity: selectedQuantity,
      price: part.price,
      availableStock: part.stocks
    }]);

    // Reset selection
    setSelectedPartId("");
    setSelectedQuantity(1);
  };

  const removePartFromSelection = (partId) => {
    setSelectedParts(prev => prev.filter(p => p.id !== partId));
  };

  const updatePartQuantity = (partId, newQuantity) => {
    const part = availableParts.find(p => p.id === partId);
    if (newQuantity > part.stocks) {
      toast.error('Quantity exceeds available stock');
      return;
    }

    setSelectedParts(prev => prev.map(p =>
      p.id === partId ? { ...p, quantity: newQuantity } : p
    ));
  };

  const handleSubmitDiagnosis = async () => {
    if (selectedParts.length === 0) {
      toast.error('Please select at least one part for replacement');
      return;
    }

    if (!diagnosisNotes.trim()) {
      toast.error('Please provide diagnosis notes');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update parts inventory and create stock logs
      console.log('Starting parts inventory update for:', selectedParts.length, 'parts');

      for (const selectedPart of selectedParts) {
        console.log('Processing part:', selectedPart.id, 'quantity:', selectedPart.quantity);

        const currentPart = await pb.collection('parts').getOne(selectedPart.id);
        console.log('Current part stock:', currentPart.stocks);

        const newStock = currentPart.stocks - selectedPart.quantity;
        console.log('New stock will be:', newStock);

        // Update part stock
        const partUpdateResult = await pb.collection('parts').update(selectedPart.id, {
          stocks: newStock
        });
        console.log('Part stock updated successfully:', partUpdateResult);

        // Create stock log entry
        const logData = {
          part: selectedPart.id,
          change_quantity: -selectedPart.quantity,
          type: 'Usage',
          related_service: service.id,
          notes: `Used for service request: ${service.id} - ${diagnosisNotes}`
        };
        console.log('Creating stock log with data:', logData);

        const logResult = await pb.collection('part_stock_log').create(logData);
        console.log('Stock log created successfully:', logResult);
      }

      console.log('Parts inventory update completed');

      // Prepare update data - only include fields that exist in schema
      const updateData = {
        status: 'scheduled'
      };

      // Add diagnosis notes if the field exists
      if (diagnosisNotes.trim()) {
        updateData.diagnosis_notes = diagnosisNotes;
      }

      // Add diagnosed parts as JSON string if we have parts
      if (selectedParts.length > 0) {
        updateData.diagnosed_parts = JSON.stringify(selectedParts.map(p => ({
          part_id: p.id,
          part_name: p.name,
          quantity: p.quantity,
          price: p.price
        })));
      }

      // Add technician info if available
      if (pb.authStore.model?.id) {
        updateData.diagnosed_by = pb.authStore.model.id;
      }

      // Add timestamp
      updateData.diagnosed_date = new Date().toISOString();

      console.log('Updating service request with data:', updateData);

      // Update service request
      await pb.collection('service_request').update(service.id, updateData);

      toast.success('Diagnosis completed successfully! Parts deducted from inventory.');
      onDiagnosisComplete?.();
      onOpenChange(false);

      // Reset form
      setSelectedParts([]);
      setDiagnosisNotes("");

    } catch (error) {
      console.error('Error submitting diagnosis:', error);

      // More detailed error handling
      if (error.response?.message) {
        toast.error(`Failed to submit diagnosis: ${error.response.message}`);
      } else if (error.message) {
        toast.error(`Failed to submit diagnosis: ${error.message}`);
      } else {
        toast.error('Failed to submit diagnosis. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalCost = () => {
    return selectedParts.reduce((total, part) =>
      total + (parseFloat(part.price) * part.quantity), 0
    ).toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Icon icon="mdi:stethoscope" className="h-6 w-6" />
            Diagnose Service Request
          </DialogTitle>
          <DialogDescription>
            Select the parts that need replacement and provide diagnosis notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium mb-2">Service Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Customer:</strong> {service?.user || '—'}</div>
              <div><strong>Product:</strong> {service?.product || '—'}</div>
              <div><strong>Request ID:</strong> {service?.id || '—'}</div>
              <div><strong>Current Status:</strong> {service?.status || '—'}</div>
            </div>
          </div>

          {/* Add Parts Section */}
          <div className="space-y-4">
            <h4 className="font-medium">Select Parts for Replacement</h4>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="part-select">Part</Label>
                <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a part" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableParts.map(part => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.name} (Stock: {part.stocks})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={addPartToSelection}
                  className="w-full"
                  disabled={!selectedPartId}
                >
                  <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
                  Add Part
                </Button>
              </div>
            </div>
          </div>

          {/* Selected Parts List */}
          {selectedParts.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Selected Parts for Replacement</h4>
              <div className="border rounded-md">
                <div className="grid grid-cols-5 gap-4 p-3 bg-gray-50 font-medium text-sm">
                  <div>Part Name</div>
                  <div>Quantity</div>
                  <div>Price</div>
                  <div>Subtotal</div>
                  <div>Action</div>
                </div>

                {selectedParts.map((part, index) => (
                  <div key={part.id} className={`grid grid-cols-5 gap-4 p-3 text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="font-medium">{part.name}</div>
                    <div>
                      <Input
                        type="number"
                        min="1"
                        max={part.availableStock}
                        value={part.quantity}
                        onChange={(e) => updatePartQuantity(part.id, parseInt(e.target.value) || 1)}
                        className="w-16 h-8"
                      />
                    </div>
                    <div>₱{parseFloat(part.price).toFixed(2)}</div>
                    <div className="font-medium">₱{(parseFloat(part.price) * part.quantity).toFixed(2)}</div>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePartFromSelection(part.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Icon icon="mdi:delete" className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="p-3 bg-gray-100 border-t font-medium">
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span>₱{calculateTotalCost()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Diagnosis Notes */}
          <div className="space-y-2">
            <Label htmlFor="diagnosis-notes">Diagnosis Notes *</Label>
            <Textarea
              id="diagnosis-notes"
              placeholder="Describe the problem and what needs to be done..."
              value={diagnosisNotes}
              onChange={(e) => setDiagnosisNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitDiagnosis}
            disabled={isSubmitting || selectedParts.length === 0 || !diagnosisNotes.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Icon icon="mdi:loading" className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Icon icon="mdi:check" className="h-4 w-4 mr-2" />
                Complete Diagnosis
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DiagnoseServiceDialog;