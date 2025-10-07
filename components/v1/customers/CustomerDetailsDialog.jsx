"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import pb from "@/services/pocketbase";

const CustomerDetailsDialog = ({ open, onOpenChange, customer }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const fetchCustomerOrders = async () => {
      if (!customer?.id || !open) return;

      setLoadingOrders(true);
      try {
        const result = await pb.collection("user_order").getFullList({
          filter: `user = "${customer.id}"`,
          expand: 'products,address,branch',
          sort: '-created',
          requestKey: null
        });
        setOrders(result);
      } catch (error) {
        console.error("Error fetching customer orders:", error);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchCustomerOrders();
  }, [customer?.id, open]);

  if (!customer) return null;

  const avatarUrl = customer.avatar
    ? pb.files.getUrl(customer, customer.avatar, { thumb: '100x100' })
    : null;
  const initials = customer.name
    ? customer.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'NA';

  const stats = customer.orderStats || {
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    totalSpent: 0
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Icon icon="mdi:account-circle" className="w-6 h-6 text-indigo-600" />
            Customer Details
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            {/* Customer Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:account" className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar and Name */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl} alt={customer.name || 'Customer'} />
                    <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{customer.name || "N/A"}</h3>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                    {customer.verified ? (
                      <Badge className="mt-2 bg-green-100 text-green-700 border-green-300">
                        <Icon icon="mdi:check-circle" className="w-3 h-3 mr-1" />
                        Verified Account
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-2 bg-gray-100 text-gray-700">
                        <Icon icon="mdi:clock-outline" className="w-3 h-3 mr-1" />
                        Pending Verification
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer ID</p>
                    <p className="font-mono text-sm">{customer.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email Visibility</p>
                    <p className="text-sm">{customer.emailVisibility ? "Public" : "Private"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge variant="outline">{customer.role || "customer"}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="text-sm">
                      {new Date(customer.created).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Branch Assignment Card - Based on Last Order */}
            {customer.lastOrderBranchDetails ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="mdi:office-building" className="w-5 h-5" />
                    Last Order Branch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Branch Name:</span>
                      <span className="text-sm">{customer.lastOrderBranchDetails.branch_name || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Branch Email:</span>
                      <span className="text-sm">{customer.lastOrderBranchDetails.branch_email || "N/A"}</span>
                    </div>
                    {customer.lastOrderBranchDetails.branch_latitude && customer.lastOrderBranchDetails.branch_longitude && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Location:</span>
                        <span className="text-sm font-mono">
                          {customer.lastOrderBranchDetails.branch_latitude.toFixed(4)}, {customer.lastOrderBranchDetails.branch_longitude.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    <Icon icon="mdi:information-outline" className="w-3 h-3 inline mr-1" />
                    This is the branch from the customer's most recent order
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="mdi:office-building-outline" className="w-5 h-5" />
                    Last Order Branch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-md flex items-center gap-2">
                    <Icon icon="mdi:alert-circle-outline" className="w-5 h-5 text-amber-600" />
                    <span className="text-sm text-amber-700">This customer has not placed any orders yet</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:cart" className="w-5 h-5" />
                  Order History ({orders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-8">
                    <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-md p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm font-medium">{order.id}</span>
                          <Badge className={
                            order.status === 'completed' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' || order.status === 'Declined' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center justify-between">
                            <span>Payment:</span>
                            <span className="font-medium">{order.mode_of_payment || "N/A"}</span>
                          </div>
                          {order.delivery_fee && (
                            <div className="flex items-center justify-between">
                              <span>Delivery Fee:</span>
                              <span className="font-medium">₱{order.delivery_fee.toFixed(2)}</span>
                            </div>
                          )}
                          {order.expand?.branch?.branch_name && (
                            <div className="flex items-center justify-between">
                              <span>Branch:</span>
                              <span className="font-medium">{order.expand.branch.branch_name}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span>Date:</span>
                            <span className="font-medium">
                              {new Date(order.created).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Icon icon="mdi:cart-off" className="w-12 h-12 mb-2 opacity-50" />
                    <p>No orders found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Icon icon="mdi:cart-outline" className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Icon icon="mdi:check-circle" className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">{stats.completed}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Icon icon="mdi:clock-outline" className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Icon icon="mdi:close-circle" className="w-8 h-8 mx-auto mb-2 text-red-600" />
                    <p className="text-2xl font-bold">{stats.cancelled}</p>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:currency-usd" className="w-5 h-5" />
                  Total Spending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-green-600">₱{stats.totalSpent.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Lifetime value from completed orders</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailsDialog;
