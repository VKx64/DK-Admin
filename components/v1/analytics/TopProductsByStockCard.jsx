import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 shadow-md border border-gray-200 rounded-md">
        <p className="font-medium">{label}</p>
        <p className="text-gray-700">{`Stock: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const TopProductsByStockCard = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-lg font-semibold mb-4">Top 5 Products by Stock</h4>
        <p className="text-gray-500">No data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h4 className="text-lg font-semibold mb-4">Top 5 Products by Stock</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={data} 
          layout="vertical" 
          margin={{ top: 5, right: 20, left: 110, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis 
            type="number" 
            allowDecimals={false} 
            tickLine={true}
            axisLine={true}
            minTickGap={5}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={110} 
            interval={0} 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={true}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          <Bar 
            dataKey="stock" 
            fill="#ffc658" 
            name="Stock Quantity"
            radius={[0, 4, 4, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        {data.map((item, index) => (
          <div key={`stock-item-${index}`} className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2 bg-amber-400" />
            <span className="text-sm">{item.name}: {item.stock} units</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProductsByStockCard;