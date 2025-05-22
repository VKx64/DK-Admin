import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 shadow-md border border-gray-200 rounded-md">
        <p className="font-medium">{label}</p>
        <p className="text-gray-700">{`Revenue: $${payload[0].value.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

const RevenueTrendCard = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-lg font-semibold mb-4">Revenue Trend</h4>
        <p className="text-gray-500">No data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h4 className="text-lg font-semibold mb-4">Revenue Trend</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={true}
            axisLine={true}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            tickLine={true}
            axisLine={true}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#8b5cf6"
            strokeWidth={2}
            name="Revenue"
            activeDot={{ r: 6 }}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-2 bg-purple-500" />
          <span className="text-sm font-medium">Revenue</span>
        </div>
        {data.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <p>
              Total revenue: $
              {data
                .reduce((sum, item) => sum + item.revenue, 0)
                .toLocaleString()}
            </p>
            <p>
              Average per period: $
              {(data.reduce((sum, item) => sum + item.revenue, 0) / data.length)
                .toFixed(2)
                .toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueTrendCard;
