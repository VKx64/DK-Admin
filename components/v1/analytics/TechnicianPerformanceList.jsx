"use client";
import React, { useState, useMemo } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

const TechnicianPerformanceList = ({ technicians, serviceRequests }) => {
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null,
  });

  // Calculate technician performance based on date filter
  const filteredTechnicianPerformance = useMemo(() => {
    if (!serviceRequests || !technicians) return [];

    // Filter service requests by date range if selected
    let filteredRequests = serviceRequests.filter(req => req.status === "completed");

    if (dateRange.from) {
      filteredRequests = filteredRequests.filter(req => {
        if (!req.created) return false;
        const reqDate = parseISO(req.created);
        const start = startOfDay(dateRange.from);
        const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        return isWithinInterval(reqDate, { start, end });
      });
    }

    // Count completed jobs per technician
    const completedJobsByTechnician = filteredRequests.reduce((acc, req) => {
      if (req.assigned_technician) {
        acc[req.assigned_technician] = (acc[req.assigned_technician] || 0) + 1;
      }
      return acc;
    }, {});

    // Map technicians with their completed jobs count
    return technicians
      .map((tech) => ({
        name: tech.name || tech.email,
        completedJobs: completedJobsByTechnician[tech.id] || 0,
        specialization: tech.technician_details?.specialization || "General",
      }))
      .filter((t) => t.completedJobs > 0)
      .sort((a, b) => b.completedJobs - a.completedJobs);
  }, [technicians, serviceRequests, dateRange]);

  // Reset date filter
  const handleResetFilter = () => {
    setDateRange({ from: null, to: null });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Technician Performance (Top 10 by Completed Jobs)
        </h3>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <Icon icon="mdi:calendar" className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                      {format(dateRange.to, "MMM dd, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM dd, yyyy")
                  )
                ) : (
                  "Filter by date"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {dateRange.from && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilter}
              className="h-8 px-2"
            >
              <Icon icon="mdi:close" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Date filter info */}
      {dateRange.from && (
        <div className="mb-4 text-sm bg-blue-50 border border-blue-200 rounded p-2 text-blue-700">
          <Icon icon="mdi:information" className="inline h-4 w-4 mr-1" />
          Showing completed jobs from{" "}
          {format(dateRange.from, "MMMM dd, yyyy")}
          {dateRange.to && ` to ${format(dateRange.to, "MMMM dd, yyyy")}`}
        </div>
      )}

      {filteredTechnicianPerformance.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Icon icon="mdi:account-off" className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>No completed jobs found for the selected period</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTechnicianPerformance.slice(0, 10).map((tech, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{tech.name}</p>
                  <p className="text-sm text-gray-600">
                    {tech.specialization}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">
                  {tech.completedJobs} completed {tech.completedJobs === 1 ? 'job' : 'jobs'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicianPerformanceList;