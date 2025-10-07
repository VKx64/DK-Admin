"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPinIcon,
  PhoneIcon,
  PackageIcon,
  CreditCardIcon,
  CalendarIcon,
  CheckCircleIcon
} from "lucide-react";
import ProofOfDeliveryDialog from './ProofOfDeliveryDialog';
import pb from '@/services/pocketbase';

const DeliveryCard = ({ order, onDeliveryCompleted }) => {
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      'Approved': 'bg-green-100 text-green-800',
      'ready_for_delivery': 'bg-blue-100 text-blue-800',
      'on_the_way': 'bg-purple-100 text-purple-800',
      'completed': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Format status text
  const formatStatus = (status) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const isCompleted = order.status === 'completed';

  return (
    <>
      <Card className={`${isCompleted ? 'opacity-75' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Order #{order.id}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(order.created).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {formatStatus(order.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Customer Information */}
          <div className="bg-gray-50 p-3 rounded-md space-y-2">
            <h4 className="font-semibold text-sm mb-2">Customer Details</h4>
            <div className="flex items-start gap-2 text-sm">
              <MapPinIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">{order.expand?.address?.name || 'N/A'}</div>
                <div className="text-muted-foreground">
                  {order.expand?.address?.address || order.expand?.address?.street_address}
                </div>
                <div className="text-muted-foreground">
                  {order.expand?.address?.city}, {order.expand?.address?.zip_code}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${order.expand?.address?.phone}`}
                className="text-blue-600 hover:underline"
              >
                {order.expand?.address?.phone || 'N/A'}
              </a>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <PackageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {order.products?.length || 0} item(s)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
              <span>{order.mode_of_payment}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee:</span>
                <span className="font-medium">{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
          </div>

          {/* Delivery Proof (if completed) */}
          {isCompleted && order.delivery_proof_image && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-md">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="font-medium text-sm">Delivery Completed</span>
              </div>
              {order.delivery_completed_date && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <CalendarIcon className="h-3 w-3" />
                  <span>{new Date(order.delivery_completed_date).toLocaleString()}</span>
                </div>
              )}
              <img
                src={pb.files.getUrl(order, order.delivery_proof_image, { thumb: '300x300' })}
                alt="Delivery Proof"
                className="w-full rounded border border-green-300 cursor-pointer hover:opacity-90"
                onClick={() => window.open(pb.files.getUrl(order, order.delivery_proof_image), '_blank')}
              />
              {order.delivery_notes && (
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="font-medium">Notes:</span> {order.delivery_notes}
                </p>
              )}
            </div>
          )}

          {/* Action Button */}
          {!isCompleted && (
            <Button
              className="w-full"
              onClick={() => setIsProofDialogOpen(true)}
            >
              Mark as Delivered
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Proof of Delivery Dialog */}
      <ProofOfDeliveryDialog
        open={isProofDialogOpen}
        onOpenChange={setIsProofDialogOpen}
        order={order}
        onSuccess={onDeliveryCompleted}
      />
    </>
  );
};

export default DeliveryCard;
