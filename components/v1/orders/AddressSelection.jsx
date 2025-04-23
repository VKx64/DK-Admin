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

const AddressSelection = ({ formData, setFormData, userAddresses = [] }) => {
  const [selectedAddressId, setSelectedAddressId] = useState(formData.address_id || '');
  const [showAddForm, setShowAddForm] = useState(false);

  // New address form state
  const [newAddress, setNewAddress] = useState({
    name: '',
    address: '',
    city: '',
    zip_code: '',
    phone: '',
    additional_notes: ''
  });

  // Handle address selection change
  const handleAddressSelect = (value) => {
    setSelectedAddressId(value);

    // If "add_new" is selected, show the form
    if (value === 'add_new') {
      setShowAddForm(true);
      // Clear the address_id in formData since we're creating a new one
      setFormData(prev => ({
        ...prev,
        address_id: null
      }));
    } else {
      setShowAddForm(false);
      // Set the selected address_id in formData
      setFormData(prev => ({
        ...prev,
        address_id: value
      }));
    }
  };

  // Handle new address form input changes
  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }));

    // Update the form data with the new address fields
    setFormData(prev => ({
      ...prev,
      new_address: {
        ...prev.new_address,
        [name]: value
      }
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="addressSelect">Shipping Address</Label>
        <Select
          value={selectedAddressId}
          onValueChange={handleAddressSelect}
        >
          <SelectTrigger id="addressSelect">
            <SelectValue placeholder="Select shipping address" />
          </SelectTrigger>
          <SelectContent>
            {userAddresses.map(address => (
              <SelectItem key={address.id} value={address.id}>
                {address.name} - {address.address}, {address.city}
              </SelectItem>
            ))}
            <SelectItem value="add_new">
              + Add New Address
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* New Address Form - shown automatically when "Add New Address" is selected */}
      {showAddForm && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">New Shipping Address</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={newAddress.name}
                  onChange={handleAddressInputChange}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={newAddress.address}
                  onChange={handleAddressInputChange}
                  placeholder="Street address"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={newAddress.city}
                    onChange={handleAddressInputChange}
                    placeholder="City"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    name="zip_code"
                    value={newAddress.zip_code}
                    onChange={handleAddressInputChange}
                    placeholder="ZIP Code"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={newAddress.phone}
                  onChange={handleAddressInputChange}
                  placeholder="Phone number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_notes">Additional Notes (Optional)</Label>
                <textarea
                  id="additional_notes"
                  name="additional_notes"
                  value={newAddress.additional_notes}
                  onChange={handleAddressInputChange}
                  className="w-full border rounded-md p-2"
                  placeholder="Delivery instructions, landmark, etc."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display selected address details when an existing address is selected */}
      {selectedAddressId && selectedAddressId !== 'add_new' && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
          {userAddresses.find(addr => addr.id === selectedAddressId)?.name}<br />
          {userAddresses.find(addr => addr.id === selectedAddressId)?.address}<br />
          {userAddresses.find(addr => addr.id === selectedAddressId)?.city}, {userAddresses.find(addr => addr.id === selectedAddressId)?.zip_code}<br />
          {userAddresses.find(addr => addr.id === selectedAddressId)?.phone}
        </div>
      )}
    </div>
  );
};

export default AddressSelection;
