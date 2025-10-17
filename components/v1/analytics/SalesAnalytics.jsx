"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
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
import { format, parseISO, startOfDay, endOfDay, subDays, isWithinInterval, startOfQuarter, endOfQuarter, subQuarters } from "date-fns";
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
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("today");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter branches based on user role and set default branch for admin users
  const availableBranches = useMemo(() => {
    if (user?.role === "admin" && user?.branch_details) {
      // Admin users can only see their managed branch
      return branches.filter(branch => branch.id === user.branch_details);
    } else if (user?.role === "super-admin") {
      // Super-admin can see all branches
      return branches;
    }
    // Default case (fallback)
    return branches;
  }, [branches, user?.role, user?.branch_details]);

  // Set initial branch selection for admin users
  useEffect(() => {
    if (user?.role === "admin" && user?.branch_details && selectedBranch === "all") {
      setSelectedBranch(user.branch_details);
    }
  }, [user?.role, user?.branch_details, selectedBranch]);

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
      case "thisquarter":
        return {
          start: startOfQuarter(today),
          end: endOfDay(today),
        };
      case "lastquarter":
        const lastQuarter = subQuarters(today, 1);
        return {
          start: startOfQuarter(lastQuarter),
          end: endOfQuarter(lastQuarter),
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

      // Role-based branch filtering: Admin users can only see orders from their managed branch
      let matchesUserBranch = true;
      if (user?.role === "admin" && user?.branch_details) {
        matchesUserBranch = order.branch === user.branch_details;
      }
      // Super-admin can see all orders (no additional filtering needed)

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

      return withinDateRange && matchesBranch && matchesStatus && matchesUserBranch && matchesSearch;
    });
  }, [orders, dateRange, selectedBranch, selectedStatus, searchTerm, users, products, user?.role, user?.branch_details]);

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
    // Create report data
    const reportData = {
      filters: {
        timeRange: selectedTimeRange,
        dateRange: {
          start: format(dateRange.start, 'MMMM dd, yyyy'),
          end: format(dateRange.end, 'MMMM dd, yyyy')
        },
        branch: selectedBranch === "all" ? "All Branches" : branches.find(b => b.id === selectedBranch)?.branch_name,
        status: selectedStatus === "all" ? "All Status" : selectedStatus,
      },
      summary: {
        totalOrders: salesData.totalOrders,
        totalRevenue: salesData.totalRevenue,
        averageOrderValue: salesData.averageOrderValue,
        topProductsCount: salesData.topProducts.length
      },
      topProducts: salesData.productSales,
      dailySales: salesData.dailySales,
      branchSales: salesData.branchSales
    };

    // Generate HTML report
    const reportHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sales Report - ${reportData.filters.dateRange.start} to ${reportData.filters.dateRange.end}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background: #f5f5f5;
            padding: 20px;
            color: #333;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 {
            color: #1f2937;
            font-size: 32px;
            margin-bottom: 10px;
          }
          .report-info {
            color: #6b7280;
            font-size: 14px;
            margin-top: 10px;
          }
          .report-info p {
            margin: 5px 0;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .card.green {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }
          .card.blue {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          }
          .card.orange {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          }
          .card-title {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .card-value {
            font-size: 28px;
            font-weight: bold;
          }
          .section {
            margin-bottom: 40px;
          }
          .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
          }
          tr:hover {
            background: #f9fafb;
          }
          .text-right {
            text-align: right;
          }
          .rank {
            background: #3b82f6;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
          }
          .rank.gold {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          }
          .rank.silver {
            background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
          }
          .rank.bronze {
            background: linear-gradient(135deg, #cd7f32 0%, #b8692e 100%);
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .print-button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: background 0.2s;
          }
          .print-button:hover {
            background: #2563eb;
          }
          @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; padding: 20px; }
            .print-button { display: none; }
          }
          .highlight {
            background: #fef3c7;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <button class="print-button" onclick="window.print()">🖨️ Print Report</button>

          <div class="header">
            <h1>📊 Sales Analytics Report</h1>
            <div class="report-info">
              <p><strong>Period:</strong> ${reportData.filters.dateRange.start} to ${reportData.filters.dateRange.end}</p>
              <p><strong>Branch:</strong> ${reportData.filters.branch}</p>
              <p><strong>Status Filter:</strong> ${reportData.filters.status}</p>
              <p><strong>Generated:</strong> ${format(new Date(), 'MMMM dd, yyyy - hh:mm a')}</p>
            </div>
          </div>

          <div class="summary-cards">
            <div class="card green">
              <div class="card-title">Total Revenue</div>
              <div class="card-value">${formatCurrency(reportData.summary.totalRevenue)}</div>
            </div>
            <div class="card blue">
              <div class="card-title">Total Orders</div>
              <div class="card-value">${reportData.summary.totalOrders.toLocaleString()}</div>
            </div>
            <div class="card orange">
              <div class="card-title">Average Order Value</div>
              <div class="card-value">${formatCurrency(reportData.summary.averageOrderValue)}</div>
            </div>
            <div class="card">
              <div class="card-title">Products Sold</div>
              <div class="card-value">${reportData.summary.topProductsCount}</div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">🏆 Top Products by Sales</h2>
            <p style="margin-bottom: 15px; color: #6b7280;">
              These are the best-performing products during the selected period, ranked by total revenue.
            </p>
            <table>
              <thead>
                <tr>
                  <th style="width: 60px;">Rank</th>
                  <th>Product Name</th>
                  <th class="text-right">Quantity Sold</th>
                  <th class="text-right">Total Revenue</th>
                  <th class="text-right">Avg. Price</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.topProducts.map((product, index) => `
                  <tr>
                    <td>
                      <span class="rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}">${index + 1}</span>
                    </td>
                    <td>
                      <strong>${product.name}</strong>
                      ${index < 3 ? '<span class="highlight">Top Seller</span>' : ''}
                    </td>
                    <td class="text-right">${product.quantity.toLocaleString()}</td>
                    <td class="text-right"><strong>${formatCurrency(product.revenue)}</strong></td>
                    <td class="text-right">${formatCurrency(product.revenue / product.quantity)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${reportData.dailySales && reportData.dailySales.length > 0 ? `
          <div class="section">
            <h2 class="section-title">📅 Daily Sales Breakdown</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th class="text-right">Number of Orders</th>
                  <th class="text-right">Total Revenue</th>
                  <th class="text-right">Avg. per Order</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.dailySales.map(day => `
                  <tr>
                    <td><strong>${format(new Date(day.date), 'MMMM dd, yyyy')}</strong></td>
                    <td class="text-right">${day.orders.toLocaleString()}</td>
                    <td class="text-right"><strong>${formatCurrency(day.revenue)}</strong></td>
                    <td class="text-right">${formatCurrency(day.revenue / day.orders)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${reportData.branchSales && reportData.branchSales.length > 1 ? `
          <div class="section">
            <h2 class="section-title">🏢 Branch Performance</h2>
            <table>
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th class="text-right">Total Orders</th>
                  <th class="text-right">Total Revenue</th>
                  <th class="text-right">Avg. per Order</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.branchSales.map(branch => `
                  <tr>
                    <td><strong>${branch.name}</strong></td>
                    <td class="text-right">${branch.orders.toLocaleString()}</td>
                    <td class="text-right"><strong>${formatCurrency(branch.revenue)}</strong></td>
                    <td class="text-right">${formatCurrency(branch.revenue / branch.orders)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="footer">
            <p>This report was automatically generated by the DK-Admin Analytics System</p>
            <p style="margin-top: 5px;">© ${new Date().getFullYear()} - All Rights Reserved</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Open report in new tab
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write(reportHTML);
      reportWindow.document.close();
    } else {
      alert('Please allow pop-ups to view the report');
    }
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
              <SelectItem value="thisquarter">This Quarter</SelectItem>
              <SelectItem value="lastquarter">Last Quarter</SelectItem>
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

          <Select
            value={selectedBranch}
            onValueChange={setSelectedBranch}
            disabled={user?.role === "admin"} // Disable dropdown for admin users
          >
            <SelectTrigger className={`w-40 ${user?.role === "admin" ? "opacity-75 cursor-not-allowed" : ""}`}>
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              {user?.role === "super-admin" && (
                <SelectItem value="all">All Branches</SelectItem>
              )}
              {availableBranches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.branch_name || `Branch ${branch.id}`}
                </SelectItem>
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
