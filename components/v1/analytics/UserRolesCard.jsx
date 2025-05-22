import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 shadow-md border border-gray-200 rounded-md">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-gray-700">{`Count: ${payload[0].value}`}</p>
        <p className="text-gray-700">
          {`Percentage: ${(payload[0].payload.percent * 100).toFixed(1)}%`}
        </p>
      </div>
    );
  }
  return null;
};

const UserRolesCard = ({ data, PIE_COLORS }) => {
  // Calculate total for percentage
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  // Add percent to each data item
  const dataWithPercent = data.map((item) => ({
    ...item,
    percent: item.value / total,
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h4 className="text-lg font-semibold mb-4">User Roles Distribution</h4>

      <div className="flex flex-col md:flex-row">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dataWithPercent}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={90}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {dataWithPercent.map((entry, index) => (
                  <Cell
                    key={`cell-role-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                formatter={(value, entry) => (
                  <span className="text-sm font-medium">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {dataWithPercent.map((entry, index) => (
          <div key={`stat-${index}`} className="flex items-center">
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserRolesCard;
