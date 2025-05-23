import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 shadow-md border border-gray-200 rounded-md">
        <p className="font-medium">{label}</p>
        <p className="text-gray-700">{`New Users: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const UserRegistrationsTrendCard = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-lg font-semibold mb-4">User Registrations Trend</h4>
        <p className="text-gray-500">No data available.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h4 className="text-lg font-semibold mb-4">User Registrations Trend</h4>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart 
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
        >
          <defs>
            <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
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
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorReg)" 
            name="New Users" 
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-2 bg-blue-500" />
          <span className="text-sm font-medium">User Registrations</span>
        </div>
        {data.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <p>Total registrations: {data.reduce((sum, item) => sum + item.count, 0)}</p>
            <p>Average per period: {(data.reduce((sum, item) => sum + item.count, 0) / data.length).toFixed(1)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRegistrationsTrendCard;