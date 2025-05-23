import React from 'react';

const TechnicianPerformanceList = ({ technicians }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h3 className="text-lg font-semibold mb-4">
        Technician Performance (Top 10 by Completed Jobs)
      </h3>
      <div className="space-y-4">
        {technicians.slice(0, 10).map((tech, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium">{tech.name}</p>
              <p className="text-sm text-gray-600">
                {tech.specialization}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-blue-600">
                {tech.completedJobs} completed jobs
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechnicianPerformanceList;