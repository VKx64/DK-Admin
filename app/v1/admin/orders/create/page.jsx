"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import PaymentDeliveryTab from './PaymentDeliveryTab';
// Import other tabs as needed

export default function CreateOrderPage() {
  const [activeTab, setActiveTab] = useState('customer');
  const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);
  const [formData, setFormData] = useState({
    // Customer info defaults
    customer_name: '',
    customer_email: '',
    // ... other default values

    // Payment & delivery defaults
    mode_of_payment: '',
    delivery_fee: 5, // Default delivery fee
    delivery_notes: '',

    // Products defaults
    products: [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation
    if (!isReadyToSubmit) {
      alert("Please select a payment method before creating the order.");
      return;
    }

    // Handle form submission logic
    console.log('Submitting order:', formData);
    // Implement your order creation logic here
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Create New Order</h1>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="customer">Customer Information</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="payment">Payment & Delivery</TabsTrigger>
          </TabsList>

          <TabsContent value="customer">
            {/* Customer Information Tab */}
            {/* ... */}
          </TabsContent>

          <TabsContent value="products">
            {/* Products Tab */}
            {/* ... */}
          </TabsContent>

          <TabsContent value="payment">
            <PaymentDeliveryTab
              formData={formData}
              setFormData={setFormData}
              setIsReadyToSubmit={setIsReadyToSubmit}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (activeTab === 'payment') setActiveTab('products');
              else if (activeTab === 'products') setActiveTab('customer');
            }}
            disabled={activeTab === 'customer'}
          >
            Previous
          </Button>

          {activeTab !== 'payment' ? (
            <Button
              type="button"
              onClick={() => {
                if (activeTab === 'customer') setActiveTab('products');
                else if (activeTab === 'products') setActiveTab('payment');
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!isReadyToSubmit}
              className={!isReadyToSubmit ? "opacity-50 cursor-not-allowed" : ""}
            >
              Create Order
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
