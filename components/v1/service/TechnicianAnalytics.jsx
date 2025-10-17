"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { pb } from '@/lib/pocketbase';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';

const TechnicianAnalytics = () => {
  const { user } = useAuth();
  const [serviceRequests, setServiceRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [services, users] = await Promise.all([
          pb.collection("service_request").getFullList({ requestKey: null }),
          pb.collection("users").getFullList({ requestKey: null }),
        ]);

        setServiceRequests(services);
        const techs = users.filter((u) => u.role === "technician");
        setTechnicians(techs);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const technicianRankings = useMemo(() => {
    if (!technicians.length || !serviceRequests.length) return [];

    // Count completed service requests per technician
    const completedByTechnician = serviceRequests.reduce((acc, req) => {
      if (req.status === "completed" && req.assigned_technician) {
        acc[req.assigned_technician] = (acc[req.assigned_technician] || 0) + 1;
      }
      return acc;
    }, {});

    // Map technicians with their completed count
    const rankings = technicians
      .map((tech) => ({
        id: tech.id,
        name: tech.name || tech.email,
        completedRequests: completedByTechnician[tech.id] || 0,
      }))
      .sort((a, b) => b.completedRequests - a.completedRequests);

    return rankings;
  }, [technicians, serviceRequests]);

  const topTechnician = technicianRankings.length > 0 ? technicianRankings[0] : null;

  // Only show to super-admin and admin
  if (!user || (user.role !== 'super-admin' && user.role !== 'admin')) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <Icon icon="mdi:loading" className="animate-spin text-4xl text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Technician Analytics
        </h3>
        <Icon icon="mdi:chart-bar" className="text-2xl text-blue-500" />
      </div>

      {/* Top Technician Card */}
      {topTechnician && topTechnician.completedRequests > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <Icon icon="mdi:trophy" className="text-3xl text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Top Technician</p>
              <p className="text-xl font-bold text-gray-800">{topTechnician.name}</p>
              <p className="text-sm text-gray-700">
                {topTechnician.completedRequests} completed service requests
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rankings Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Technician
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed Requests
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {technicianRankings.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              technicianRankings.map((tech, index) => (
                <tr
                  key={tech.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    index === 0 && tech.completedRequests > 0 ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {index === 0 && tech.completedRequests > 0 && (
                        <Icon icon="mdi:medal" className="text-xl text-yellow-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        #{index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{tech.name}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-blue-600">
                      {tech.completedRequests}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TechnicianAnalytics;
