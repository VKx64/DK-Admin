"use client";

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import AddressSelection from '@/components/v1/orders/AddressSelection';

const CustomerTab = ({ formData, setFormData, userAddresses = [] }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Customer Information</h3>

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customer_name || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  customer_name: e.target.value
                }))}
                placeholder="Customer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Customer Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customer_email || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  customer_email: e.target.value
                }))}
                placeholder="Email address"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {/* The AddressSelection component now handles showing/hiding the form automatically */}
          <AddressSelection
            formData={formData}
            setFormData={setFormData}
            userAddresses={userAddresses}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerTab;
