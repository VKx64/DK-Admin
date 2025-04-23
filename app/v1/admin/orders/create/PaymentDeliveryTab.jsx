"use client";

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const PaymentDeliveryTab = ({ formData, setFormData, setIsReadyToSubmit }) => {
  // Check if payment method is set
  const isPaymentMethodSet = !!formData.mode_of_payment;

  // Effect to update the ready state based on validation
  useEffect(() => {
    // Order is ready to submit if payment method is set
    setIsReadyToSubmit(isPaymentMethodSet);
  }, [isPaymentMethodSet, setIsReadyToSubmit]);

  // Handle payment method change
  const handlePaymentMethodChange = (value) => {
    setFormData(prev => ({
      ...prev,
      mode_of_payment: value
    }));
  };

  // Handle delivery fee change
  const handleDeliveryFeeChange = (e) => {
    const fee = parseFloat(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      delivery_fee: fee
    }));
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Payment Information</h3>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method <span className="text-red-500">*</span></Label>
              <Select
                value={formData.mode_of_payment || ''}
                onValueChange={handlePaymentMethodChange}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash on Delivery">Cash on Delivery</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                </SelectContent>
              </Select>

              {isPaymentMethodSet ? (
                <div className="text-green-600 text-xs flex items-center mt-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Payment method selected
                </div>
              ) : (
                <div className="text-amber-600 text-xs flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Please select a payment method
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Delivery Information</h3>

            <div className="space-y-2">
              <Label htmlFor="deliveryFee">Delivery Fee</Label>
              <Input
                id="deliveryFee"
                type="number"
                step="0.01"
                min="0"
                value={formData.delivery_fee || ''}
                onChange={handleDeliveryFeeChange}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Standard delivery fee is {formatCurrency(5)}. Additional fees may apply for remote locations.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Delivery Notes</Label>
              <textarea
                id="notes"
                rows={3}
                className="w-full border rounded-md p-2"
                placeholder="Add special instructions for delivery..."
                value={formData.delivery_notes || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  delivery_notes: e.target.value
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert variant={isPaymentMethodSet ? "success" : "warning"} className="mt-4">
        <AlertDescription>
          {isPaymentMethodSet ? (
            "All required information is complete. You can now create the order."
          ) : (
            "Please select a payment method before creating the order."
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default PaymentDeliveryTab;
