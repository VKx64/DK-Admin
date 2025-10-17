"use client";
import React, { useState, useEffect } from 'react';
import { getOrdersForTechnician } from '@/services/pocketbase/assignTechnician';
import DeliveryCard from './DeliveryCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DeliveryList = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !user.id) return;

      setIsLoading(true);
      try {
        const fetchedOrders = await getOrdersForTechnician(user.id);
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Error fetching delivery orders:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeliveryCompleted = () => {
    // Refresh the list after delivery completion
    setRefreshTrigger(prev => prev + 1);
  };

  // Filter orders by status
  const pendingOrders = orders.filter(order =>
    order.status === 'ready_for_delivery' ||
    order.status === 'Approved' ||
    order.status === 'on_the_way'
  );

  const completedOrders = orders.filter(order => order.status === 'completed');

  if (isLoading) {
    return (
      <div className="bg-white rounded-sm shadow-sm p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-sm shadow-sm p-8">
        <div className="text-center text-red-500">
          <p className="font-medium">Error loading deliveries</p>
          <p className="text-sm mt-1">{error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-sm shadow-sm p-4 flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Assigned Deliveries</h2>
          <span className="text-sm text-muted-foreground">
            ({orders.length} total)
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCwIcon className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingOrders.length > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="relative">
            Completed
            {completedOrders.length > 0 && (
              <span className="ml-2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {completedOrders.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="flex-1 mt-4">
          {pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <svg
                className="h-16 w-16 mb-4 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-lg font-medium">No pending deliveries</p>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-2">
              {pendingOrders.map(order => (
                <DeliveryCard
                  key={order.id}
                  order={order}
                  onDeliveryCompleted={handleDeliveryCompleted}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="flex-1 mt-4">
          {completedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <svg
                className="h-16 w-16 mb-4 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-medium">No completed deliveries</p>
              <p className="text-sm mt-1">Complete your first delivery to see it here</p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-2">
              {completedOrders.map(order => (
                <DeliveryCard
                  key={order.id}
                  order={order}
                  onDeliveryCompleted={handleDeliveryCompleted}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveryList;
