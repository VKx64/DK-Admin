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
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { format } from "date-fns";

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
  const [showReports, setShowReports] = useState(false);

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
          created: stockRecord?.created || product.created,
          updated: stockRecord?.updated || product.updated,
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
          created: part.created,
          updated: part.updated,
          type: 'part'
        };
      });
    }

    // Apply filters
    return items.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "all" ||
                             (item.category && item.category === selectedCategory) ||
                             (item.brand && item.brand === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [products, productStocks, parts, inventoryView, searchTerm, selectedCategory]);

  // Historical stock movements analysis
  const stockMovementAnalysis = useMemo(() => {
    if (inventoryView !== "parts" || !partStockLogs.length) {
      return { dailyMovements: [], topChanges: [], totalMovements: 0 };
    }

    // Group by date for daily movements chart
    const dailyMovements = partStockLogs.reduce((acc, log) => {
      const date = format(new Date(log.created), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = {
          date,
          usage: 0,
          replenishment: 0,
          adjustments: 0,
          total: 0
        };
      }

      const change = log.change_quantity || 0;
      const type = log.type?.toLowerCase() || 'other';

      if (type === 'usage' && change < 0) {
        acc[date].usage += Math.abs(change);
      } else if (type === 'replenishment' && change > 0) {
        acc[date].replenishment += change;
      } else if (['manual adjustment', 'correction'].includes(type)) {
        acc[date].adjustments += Math.abs(change);
      }

      acc[date].total += Math.abs(change);
      return acc;
    }, {});

    // Convert to array and sort by date
    const dailyMovementsArray = Object.values(dailyMovements)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Find parts with most stock changes
    const partChanges = partStockLogs.reduce((acc, log) => {
      const partId = log.part;
      if (!acc[partId]) {
        const part = parts.find(p => p.id === partId);
        acc[partId] = {
          partName: part?.name || `Part ${partId}`,
          totalChanges: 0,
          movements: 0
        };
      }
      acc[partId].totalChanges += Math.abs(log.change_quantity || 0);
      acc[partId].movements += 1;
      return acc;
    }, {});

    const topChanges = Object.values(partChanges)
      .sort((a, b) => b.totalChanges - a.totalChanges)
      .slice(0, 10);

    return {
      dailyMovements: dailyMovementsArray,
      topChanges,
      totalMovements: partStockLogs.length
    };
  }, [partStockLogs, parts, inventoryView]);

  // Generate detailed report
  const generateReport = () => {
    const reportData = {
      inventoryType: inventoryView,
      totalItems: inventoryData.length,
      stockSummary: {
        outOfStock: inventoryData.filter(item => item.stockStatus === 'Out of Stock').length,
        lowStock: inventoryData.filter(item => item.stockStatus === 'Low Stock').length,
        normal: inventoryData.filter(item => item.stockStatus === 'Normal').length,
        overstocked: inventoryData.filter(item => item.stockStatus === 'Overstocked').length,
      },
      criticalItems: inventoryData.filter(item => item.riskLevel === 'Critical' || item.riskLevel === 'High'),
      stockMovements: stockMovementAnalysis,
      generatedAt: new Date().toISOString(),
      filters: {
        branch: selectedBranch,
        category: selectedCategory,
        searchTerm
      }
    };

    // Open report in new tab/window
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(generateReportHTML(reportData));
    reportWindow.document.close();
  };

  // Generate HTML report
  const generateReportHTML = (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Analytics Report - ${data.period}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .section { margin-bottom: 30px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px; }
          .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 8px; }
          .stat-value { font-size: 2em; font-weight: bold; }
          .critical { color: #dc2626; }
          .warning { color: #f59e0b; }
          .success { color: #10b981; }
          .info { color: #3b82f6; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .badge { padding: 4px 8px; border-radius: 4px; color: white; font-size: 0.8em; }
          .badge-critical { background-color: #dc2626; }
          .badge-high { background-color: #f59e0b; }
          .badge-normal { background-color: #10b981; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Inventory Analytics Report</h1>
          <h2>${data.inventoryType.charAt(0).toUpperCase() + data.inventoryType.slice(1)} Inventory</h2>
          <p><strong>Generated:</strong> ${format(new Date(data.generatedAt), 'PPpp')}</p>
        </div>

        <div class="section">
          <h3>Executive Summary</h3>
          <div class="summary-grid">
            <div class="stat-card">
              <div class="stat-value">${data.totalItems}</div>
              <div>Total Items</div>
            </div>
            <div class="stat-card">
              <div class="stat-value critical">${data.stockSummary.outOfStock}</div>
              <div>Out of Stock</div>
            </div>
            <div class="stat-card">
              <div class="stat-value warning">${data.stockSummary.lowStock}</div>
              <div>Low Stock</div>
            </div>
            <div class="stat-card">
              <div class="stat-value info">${data.stockSummary.overstocked}</div>
              <div>Overstocked</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Critical Items Requiring Attention</h3>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Brand</th>
                <th>Current Stock</th>
                <th>Status</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              ${data.criticalItems.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.brand || 'N/A'}</td>
                  <td>${item.currentStock}</td>
                  <td><span class="badge ${item.stockStatus === 'Out of Stock' ? 'badge-critical' : 'badge-high'}">${item.stockStatus}</span></td>
                  <td><span class="badge ${item.riskLevel === 'Critical' ? 'badge-critical' : 'badge-high'}">${item.riskLevel}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${data.inventoryType === 'parts' && data.stockMovements.totalMovements > 0 ? `
        <div class="section">
          <h3>Stock Movement Analysis</h3>
          <p><strong>Total Movements:</strong> ${data.stockMovements.totalMovements}</p>

          <h4>Top Parts by Activity</h4>
          <table>
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Total Changes</th>
                <th>Number of Movements</th>
              </tr>
            </thead>
            <tbody>
              ${data.stockMovements.topChanges.map(part => `
                <tr>
                  <td>${part.partName}</td>
                  <td>${part.totalChanges}</td>
                  <td>${part.movements}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="section">
          <h3>Applied Filters</h3>
          <ul>
            <li><strong>Branch:</strong> ${data.filters.branch === 'all' ? 'All Branches' : data.filters.branch}</li>
            <li><strong>Category:</strong> ${data.filters.category === 'all' ? 'All Categories' : data.filters.category}</li>
            <li><strong>Search Term:</strong> ${data.filters.searchTerm || 'None'}</li>
          </ul>
        </div>

        <div class="section">
          <p style="text-align: center; color: #666; font-size: 0.9em;">
            This report was generated automatically by the DK-Admin Inventory Analytics System
          </p>
        </div>
      </body>
      </html>
    `;
  };
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div>
            <Input
              placeholder="Search by name or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          <div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
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
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Select value={inventoryView} onValueChange={setInventoryView}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="products">Products</SelectItem>
              <SelectItem value="parts">Parts</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>{branch.branch_name}</SelectItem>
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
                <p className="text-gray-500 text-center py-4">No critical stock items found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Movement Analysis (Parts only) */}
      {inventoryView === "parts" && stockMovementAnalysis.dailyMovements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mdi:chart-line" width="20" height="20" />
              Stock Movement Trends
              <Badge variant="outline" className="ml-2">
                {stockMovementAnalysis.totalMovements} total movements
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockMovementAnalysis.dailyMovements} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                />
                <Legend />
                <Bar dataKey="usage" stackId="a" fill="#dc2626" name="Usage" />
                <Bar dataKey="replenishment" stackId="a" fill="#10b981" name="Replenishment" />
                <Bar dataKey="adjustments" stackId="a" fill="#f59e0b" name="Adjustments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

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
                      {inventoryView === 'products' ? (item.model || 'N/A') : (item.partNumber || 'N/A')}
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
                Showing first 50 items of {inventoryData.length} total items. Use filters to narrow down results.
              </div>
            )}

            {inventoryData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Icon icon="mdi:database-search" className="mx-auto h-12 w-12 mb-4" />
                <p>No inventory items found matching the current filters.</p>
                <p className="text-sm mt-2">Try adjusting the filters to see more results.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryAnalytics;
