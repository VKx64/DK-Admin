import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 shadow-md border border-gray-200 rounded-md">
        <p className="font-medium">{label}</p>
        <p className="text-gray-700">{`Requests: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const ServiceRequestsTrendCard = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-lg font-semibold mb-4">Service Requests Trend</h4>
        <p className="text-gray-500">No data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h4 className="text-lg font-semibold mb-4">Service Requests Trend</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
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
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          <Bar
            dataKey="count"
            fill="#10b981"
            name="Service Requests"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-2 bg-emerald-500" />
          <span className="text-sm font-medium">Service Requests</span>
        </div>
        {data.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <p>
              Total requests:{" "}
              {data.reduce((sum, item) => sum + item.count, 0)}
            </p>
            <p>
              Average per period:{" "}
              {(
                data.reduce((sum, item) => sum + item.count, 0) / data.length
              ).toFixed(1)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceRequestsTrendCard;
