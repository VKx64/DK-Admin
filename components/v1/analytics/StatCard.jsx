import React from 'react';

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center">
        <div className="mr-4" style={{ color }}>
          {icon}
        </div>
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;