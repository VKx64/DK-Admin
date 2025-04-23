"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import DeliveryFeeCalculator from './DeliveryFeeCalculator';

const CreateOrderForm = () => {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      delivery_fee: 5, // Default base fee
      // other default values...
    }
  });

  // Track if we've calculated the delivery fee
  const [hasCalculatedFee, setHasCalculatedFee] = useState(false);

  // Current form values
  const currentDeliveryFee = watch('delivery_fee');

  // Handle delivery fee calculation
  const handleFeeCalculated = (fee, distance) => {
    setValue('delivery_fee', fee);
    setHasCalculatedFee(true);
  };

  // Form submission
  const onSubmit = (data) => {
    // Implement order creation logic
    console.log('Creating order with data:', data);

    // Show warning if fee wasn't calculated
    if (!hasCalculatedFee) {
      if (!confirm('You have not calculated a location-based delivery fee. Continue with default fee?')) {
        return;
      }
    }

    // Proceed with order creation...
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Customer information fields */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Customer Information</h3>
        {/* Customer fields here */}
      </div>

      {/* Shipping Address fields */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Shipping Address</h3>
        {/* Address fields here */}
      </div>

      {/* Products */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Products</h3>
        {/* Product selection here */}
      </div>

      {/* Delivery Fee */}
      <div className="border p-4 rounded-md bg-gray-50">
        <h3 className="text-md font-medium mb-3">Delivery Information</h3>

        <DeliveryFeeCalculator
          onFeeCalculated={handleFeeCalculated}
          initialFee={currentDeliveryFee}
        />

        <div className="mt-2">
          <Input
            type="hidden"
            {...register('delivery_fee')}
          />
          {hasCalculatedFee && (
            <div className="text-xs text-green-600 mt-1">
              ✓ Location-based delivery fee calculated
            </div>
          )}
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button type="submit">
          Create Order
        </Button>
      </div>
    </form>
  );
};

export default CreateOrderForm;
