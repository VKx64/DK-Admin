"use client";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Icon } from "@iconify/react";

const InventoryForecast = ({ data }) => {
  console.log("InventoryForecast received data:", data);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="mdi:chart-line" width="24" height="24" className="text-blue-600" />
          <h4 className="text-lg font-semibold">
            Inventory Forecasting
          </h4>
        </div>
        <p className="text-gray-500">No data available for forecasting.</p>
      </div>
    );
  }

  // Separate chart data and table data
  const chartData = data.filter(item => item.period);
  const tableData = data.filter(item => item.product && item.daysToReorder !== undefined);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md col-span-1 lg:col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="mdi:chart-line" width="24" height="24" className="text-blue-600" />
        <h4 className="text-lg font-semibold">
          Inventory Forecasting Based on Sales Velocity
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="md:col-span-2">
          <h5 className="text-md font-semibold mb-2 text-center">
            Product Stock Levels & Forecast
          </h5>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{ value: 'Stock Level', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value, name) => [
                  value.toFixed(0),
                  name === 'currentStock' ? 'Current Stock' :
                  name === 'predictedStock' ? 'Predicted Stock' :
                  name === 'reorderPoint' ? 'Reorder Point' : name
                ]}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="currentStock"
                stroke="#2563eb"
                strokeWidth={2}
                name="Current Stock"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="predictedStock"
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Predicted Stock"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="reorderPoint"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Reorder Point"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Table Section */}
        <div>
          <h5 className="text-md font-semibold mb-2 text-center">
            Forecast Summary
          </h5>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Days to Reorder</TableHead>
                <TableHead className="text-right">Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData
                .slice(0, 8)
                .map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="text-sm">{item.product}</TableCell>
                  <TableCell className="text-right text-sm">
                    {item.daysToReorder > 0 ? `${item.daysToReorder} days` : 'Overdue'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                      item.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.riskLevel}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default InventoryForecast;
