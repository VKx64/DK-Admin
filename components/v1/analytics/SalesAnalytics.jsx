"use client";
import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Icon } from "@iconify/react";
import { format, parseISO, startOfDay, endOfDay, subDays, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

const PIE_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF1919",
  "#4BC0C0",
  "#9966FF",
];

const SalesAnalytics = ({
  orders = [],
  products = [],
  productPricings = [],
  branches = [],
  users = []
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("today");
  const [searchTerm, setSearchTerm] = useState("");

  // Get date range based on selection
  const dateRange = useMemo(() => {
    const today = new Date();
    switch (selectedTimeRange) {
      case "today":
        return {
          start: startOfDay(today),
          end: endOfDay(today),
        };
      case "yesterday":
        const yesterday = subDays(today, 1);
        return {
          start: startOfDay(yesterday),
          end: endOfDay(yesterday),
        };
      case "last7days":
        return {
          start: startOfDay(subDays(today, 7)),
          end: endOfDay(today),
        };
      case "last30days":
        return {
          start: startOfDay(subDays(today, 30)),
          end: endOfDay(today),
        };
      case "custom":
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate),
        };
      default:
        return {
          start: startOfDay(today),
          end: endOfDay(today),
        };
    }
  }, [selectedTimeRange, selectedDate]);

  // Filter orders based on date range and other filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = parseISO(order.created);
      const withinDateRange = isWithinInterval(orderDate, dateRange);
      const matchesBranch = selectedBranch === "all" || order.branch === selectedBranch;
      const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;

      // Search functionality - search in user details or product names
      let matchesSearch = true;
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const user = users.find(u => u.id === order.user);
        const userName = user?.name || user?.email || "";

        // Get product names from the order
        const orderProductNames = (order.products || [])
          .map(productId => products.find(p => p.id === productId)?.product_name || "")
          .join(" ");

        matchesSearch = userName.toLowerCase().includes(searchLower) ||
                       orderProductNames.toLowerCase().includes(searchLower);
      }

      return withinDateRange && matchesBranch && matchesStatus && matchesSearch;
    });
  }, [orders, dateRange, selectedBranch, selectedStatus, searchTerm, users, products]);

  // Sales analytics calculations
  const salesData = useMemo(() => {
    if (!filteredOrders.length) return {
      dailySales: [],
      productSales: [],
      branchSales: [],
      statusDistribution: [],
      topProducts: [],
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0
    };

    // Create product price map
    const productPriceMap = productPricings.reduce((acc, pricing) => {
      acc[pricing.product_id] = pricing.final_price || 0;
      return acc;
    }, {});

    // Create product name map
    const productNameMap = products.reduce((acc, product) => {
      acc[product.id] = product.product_name || `Product ${product.id}`;
      return acc;
    }, {});

    // Create branch name map
    const branchNameMap = branches.reduce((acc, branch) => {
      acc[branch.id] = branch.branch_name || `Branch ${branch.id}`;
      return acc;
    }, {});

    // Daily sales aggregation
    const dailySalesMap = {};
    let totalRevenue = 0;
    const productSalesMap = {};
    const branchSalesMap = {};
    const statusMap = {};

    filteredOrders.forEach(order => {
      const orderDate = format(parseISO(order.created), 'yyyy-MM-dd');
      let orderTotal = 0;

      // Calculate order total from products
      if (order.products && Array.isArray(order.products)) {
        order.products.forEach(productId => {
          const price = productPriceMap[productId] || 0;
          orderTotal += price;

          // Track product sales
          const productName = productNameMap[productId];
          if (productName) {
            if (!productSalesMap[productName]) {
              productSalesMap[productName] = { name: productName, quantity: 0, revenue: 0 };
            }
            productSalesMap[productName].quantity += 1;
            productSalesMap[productName].revenue += price;
          }
        });
      }

      // Add delivery fee
      orderTotal += order.delivery_fee || 0;
      totalRevenue += orderTotal;

      // Daily sales
      if (!dailySalesMap[orderDate]) {
        dailySalesMap[orderDate] = { date: orderDate, revenue: 0, orders: 0 };
      }
      dailySalesMap[orderDate].revenue += orderTotal;
      dailySalesMap[orderDate].orders += 1;

      // Branch sales
      const branchName = branchNameMap[order.branch] || 'Unknown Branch';
      if (!branchSalesMap[branchName]) {
        branchSalesMap[branchName] = { name: branchName, revenue: 0, orders: 0 };
      }
      branchSalesMap[branchName].revenue += orderTotal;
      branchSalesMap[branchName].orders += 1;

      // Status distribution
      const status = order.status || 'Unknown';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    // Convert maps to arrays and sort
    const dailySales = Object.values(dailySalesMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const productSales = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue);

    const branchSales = Object.values(branchSalesMap)
      .sort((a, b) => b.revenue - a.revenue);

    const statusDistribution = Object.entries(statusMap)
      .map(([name, value]) => ({ name, value }));

    const topProducts = productSales.slice(0, 10);

    const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    return {
      dailySales,
      productSales,
      branchSales,
      statusDistribution,
      topProducts,
      totalRevenue,
      totalOrders: filteredOrders.length,
      averageOrderValue
    };
  }, [filteredOrders, productPricings, products, branches]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const generateReport = () => {
    // Placeholder for report generation logic
    console.log("Generating sales report...");

    const reportData = {
      filters: {
        timeRange: selectedTimeRange,
        date: selectedDate,
        branch: selectedBranch === "all" ? "All Branches" : branches.find(b => b.id === selectedBranch)?.branch_name,
        status: selectedStatus === "all" ? "All Status" : selectedStatus,
        searchTerm
      },
      summary: {
        totalOrders: salesData.totalOrders,
        totalRevenue: salesData.totalRevenue,
        averageOrderValue: salesData.averageOrderValue
      },
      orders: filteredOrders
    };

    // Here you could implement actual report generation/download
    alert(`Report generated! Total Orders: ${reportData.summary.totalOrders}, Revenue: ${formatCurrency(reportData.summary.totalRevenue)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div>
            <Input
              placeholder="Search by customer or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          <div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="packing">Packing</SelectItem>
                <SelectItem value="ready_for_delivery">Ready for Delivery</SelectItem>
                <SelectItem value="on_the_way">On the Way</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                <SelectItem value="Declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Date</SelectItem>
            </SelectContent>
          </Select>

          {selectedTimeRange === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <Icon icon="mdi:calendar" className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}

          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>{branch.branch_name || `Branch ${branch.id}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={generateReport}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Icon icon="mdi:file-document-outline" className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(salesData.totalRevenue)}</p>
              </div>
              <div className="ml-4 p-3 bg-green-100 rounded-full">
                <Icon icon="mdi:currency-php" className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{salesData.totalOrders.toLocaleString()}</p>
              </div>
              <div className="ml-4 p-3 bg-blue-100 rounded-full">
                <Icon icon="mdi:cart" className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Average Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(salesData.averageOrderValue)}</p>
              </div>
              <div className="ml-4 p-3 bg-purple-100 rounded-full">
                <Icon icon="mdi:trending-up" className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Top Products Sold</p>
                <p className="text-2xl font-bold">{salesData.topProducts.length}</p>
              </div>
              <div className="ml-4 p-3 bg-orange-100 rounded-full">
                <Icon icon="mdi:package-variant" className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesData.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis yAxisId="revenue" orientation="left" />
                  <YAxis yAxisId="orders" orientation="right" />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="revenue" dataKey="revenue" fill="#8884d8" name="Revenue" />
                  <Line yAxisId="orders" type="monotone" dataKey="orders" stroke="#ff7300" name="Orders" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {salesData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Sales Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Branch Sales Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData.branchSales} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products by Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData.topProducts.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Sales Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.topProducts.slice(0, 10).map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.slice(0, 10).map((order) => {
                    let orderTotal = 0;
                    if (order.products && Array.isArray(order.products)) {
                      order.products.forEach(productId => {
                        const pricing = productPricings.find(p => p.product_id === productId);
                        orderTotal += pricing?.final_price || 0;
                      });
                    }
                    orderTotal += order.delivery_fee || 0;

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <Badge variant={
                            order.status === 'completed' ? 'success' :
                            order.status === 'Declined' ? 'destructive' :
                            'secondary'
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(parseISO(order.created), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(orderTotal)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesAnalytics;
