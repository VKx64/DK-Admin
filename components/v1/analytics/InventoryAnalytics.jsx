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
  ComposedChart,
  Line,
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
import { Icon } from "@iconify/react";

const InventoryAnalytics = ({
  products = [],
  productStocks = [],
  branches = [],
  parts = [],
  partStockLogs = []
}) => {
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryView, setInventoryView] = useState("products"); // products or parts

  // Process inventory data
  const inventoryData = useMemo(() => {
    let items = [];

    if (inventoryView === "products") {
      // Process products with their stock levels
      items = products.map(product => {
        const stockRecord = productStocks.find(stock => stock.product_id === product.id);
        const stockQuantity = stockRecord ? stockRecord.stock_quantity : 0;

        // Calculate stock status
        let stockStatus = 'Normal';
        let riskLevel = 'Low';

        if (stockQuantity === 0) {
          stockStatus = 'Out of Stock';
          riskLevel = 'Critical';
        } else if (stockQuantity < 10) {
          stockStatus = 'Low Stock';
          riskLevel = 'High';
        } else if (stockQuantity > 100) {
          stockStatus = 'Overstocked';
          riskLevel = 'Medium';
        }

        return {
          id: product.id,
          name: product.product_name,
          brand: product.brand,
          category: product.category,
          model: product.product_model,
          currentStock: stockQuantity,
          stockStatus,
          riskLevel,
          type: 'product'
        };
      });
    } else {
      // Process parts with their stock levels
      items = parts.map(part => {
        const stockQuantity = part.stocks || 0;
        const reorderThreshold = part.reorder_threshold || 5;

        // Calculate stock status
        let stockStatus = 'Normal';
        let riskLevel = 'Low';

        if (stockQuantity === 0) {
          stockStatus = 'Out of Stock';
          riskLevel = 'Critical';
        } else if (stockQuantity <= reorderThreshold) {
          stockStatus = 'Low Stock';
          riskLevel = 'High';
        } else if (stockQuantity > reorderThreshold * 10) {
          stockStatus = 'Overstocked';
          riskLevel = 'Medium';
        }

        return {
          id: part.id,
          name: part.name,
          brand: part.brand,
          partNumber: part.part_number,
          currentStock: stockQuantity,
          reorderThreshold,
          stockStatus,
          riskLevel,
          type: 'part'
        };
      });
    }

    // Apply filters
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "all" ||
                             (item.category && item.category === selectedCategory) ||
                             (item.brand && item.brand === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [products, productStocks, parts, inventoryView, searchTerm, selectedCategory]);

  // Stock status distribution
  const stockStatusData = useMemo(() => {
    const distribution = {
      'Out of Stock': 0,
      'Low Stock': 0,
      'Normal': 0,
      'Overstocked': 0
    };

    inventoryData.forEach(item => {
      distribution[item.stockStatus]++;
    });

    return Object.entries(distribution).map(([status, count]) => ({
      name: status,
      value: count,
      color: status === 'Out of Stock' ? '#dc2626' :
             status === 'Low Stock' ? '#f59e0b' :
             status === 'Overstocked' ? '#3b82f6' : '#10b981'
    }));
  }, [inventoryData]);

  // Top low stock items
  const lowStockItems = useMemo(() => {
    return inventoryData
      .filter(item => item.riskLevel === 'High' || item.riskLevel === 'Critical')
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 10);
  }, [inventoryData]);

  // Stock level chart data
  const stockChartData = useMemo(() => {
    return inventoryData
      .slice(0, 20)
      .map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
        stock: item.currentStock,
        reorderPoint: item.reorderThreshold || (inventoryView === 'products' ? 10 : 5),
        status: item.stockStatus
      }));
  }, [inventoryData, inventoryView]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set();
    if (inventoryView === 'products') {
      products.forEach(product => {
        if (product.category) cats.add(product.category);
        if (product.brand) cats.add(product.brand);
      });
    } else {
      parts.forEach(part => {
        if (part.brand) cats.add(part.brand);
      });
    }
    return Array.from(cats);
  }, [products, parts, inventoryView]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:warehouse" width="24" height="24" className="text-blue-600" />
          <h2 className="text-2xl font-bold">Inventory Analytics</h2>
        </div>

        <div className="flex items-center gap-4">
          <Select value={inventoryView} onValueChange={setInventoryView}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="products">Products</SelectItem>
              <SelectItem value="parts">Parts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category/Brand</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Branch</label>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger>
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>{branch.branch_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inventoryData.filter(item => item.stockStatus === 'Out of Stock').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {inventoryData.filter(item => item.stockStatus === 'Low Stock').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Overstocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {inventoryData.filter(item => item.stockStatus === 'Overstocked').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mdi:chart-pie" width="20" height="20" />
              Stock Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stockStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stockStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Critical Items List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mdi:alert" width="20" height="20" className="text-red-500" />
              Critical Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.brand} {item.model || `#${item.partNumber}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.currentStock} units</p>
                      <Badge
                        variant={item.riskLevel === 'Critical' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {item.stockStatus}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No critical stock items</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Levels Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="mdi:chart-bar" width="20" height="20" />
            Stock Levels Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={stockChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="stock"
                fill="#3b82f6"
                name="Current Stock"
                radius={[2, 2, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="reorderPoint"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Reorder Point"
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="mdi:table" width="20" height="20" />
            Detailed Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  {inventoryView === 'products' ? (
                    <TableHead>Model</TableHead>
                  ) : (
                    <TableHead>Part Number</TableHead>
                  )}
                  <TableHead className="text-right">Current Stock</TableHead>
                  {inventoryView === 'parts' && <TableHead className="text-right">Reorder Point</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.slice(0, 50).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.brand || 'N/A'}</TableCell>
                    <TableCell>
                      {inventoryView === 'products' ? item.model : item.partNumber}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.currentStock}
                    </TableCell>
                    {inventoryView === 'parts' && (
                      <TableCell className="text-right font-mono">
                        {item.reorderThreshold}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge
                        variant={
                          item.stockStatus === 'Out of Stock' ? 'destructive' :
                          item.stockStatus === 'Low Stock' ? 'secondary' :
                          item.stockStatus === 'Overstocked' ? 'outline' : 'default'
                        }
                      >
                        {item.stockStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.riskLevel === 'Critical' ? 'destructive' :
                          item.riskLevel === 'High' ? 'secondary' : 'outline'
                        }
                      >
                        {item.riskLevel}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {inventoryData.length > 50 && (
              <div className="text-center py-4 text-sm text-gray-500">
                Showing first 50 items. Use filters to narrow down results.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryAnalytics;
