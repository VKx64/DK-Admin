"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPinIcon } from 'lucide-react';
import { calculateDistance, calculateDeliveryFee, getUserLocation, SHOP_COORDINATES } from '@/utils/locationUtils';

/**
 * A reusable component for calculating delivery fees based on location during order creation
 */
const DeliveryFeeCalculator = ({ onFeeCalculated }) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [distance, setDistance] = useState(null);
  const [calculatedFee, setCalculatedFee] = useState(null);
  const [error, setError] = useState(null);

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const calculateFee = async () => {
    setIsCalculating(true);
    setError(null);

    try {
      const location = await getUserLocation();

      const distanceInKm = calculateDistance(
        SHOP_COORDINATES.latitude,
        SHOP_COORDINATES.longitude,
        location.latitude,
        location.longitude
      );

      setDistance(distanceInKm);
      const fee = calculateDeliveryFee(distanceInKm);
      setCalculatedFee(fee);

      // Call the callback with the calculated fee and distance
      if (onFeeCalculated) {
        onFeeCalculated(fee, distanceInKm);
      }
    } catch (error) {
      console.error("Error calculating delivery fee:", error);
      setError(error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-3 p-4 border rounded-md bg-gray-50">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Calculate delivery fee by location:</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={calculateFee}
          disabled={isCalculating}
          className="flex items-center"
        >
          {isCalculating ? (
            <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-current rounded-full mr-2"></div>
          ) : (
            <MapPinIcon className="h-4 w-4 mr-2" />
          )}
          Calculate Fee
        </Button>
      </div>

      {distance !== null && (
        <div className="grid grid-cols-2 gap-y-1 text-sm mt-2">
          <div className="text-muted-foreground">Distance:</div>
          <div className="text-right font-medium">{distance.toFixed(2)} km</div>

          <div className="text-muted-foreground">Base fee (0-5km):</div>
          <div className="text-right">{formatCurrency(5)}</div>

          {distance > 5 && (
            <>
              <div className="text-muted-foreground">Additional distance:</div>
              <div className="text-right">{(distance - 5).toFixed(2)} km</div>

              {distance > 10 && (
                <>
                  <div className="text-muted-foreground">Rate 5-10km:</div>
                  <div className="text-right">$2.00/km</div>

                  {distance > 20 && (
                    <>
                      <div className="text-muted-foreground">Rate 10-20km:</div>
                      <div className="text-right">$1.50/km</div>

                      <div className="text-muted-foreground">Rate beyond 20km:</div>
                      <div className="text-right">$1.00/km</div>
                    </>
                  )}
                </>
              )}
            </>
          )}

          <div className="text-muted-foreground font-medium border-t pt-1 mt-1">Calculated fee:</div>
          <div className="text-right font-medium border-t pt-1 mt-1">{formatCurrency(calculatedFee)}</div>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-xs mt-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default DeliveryFeeCalculator;
