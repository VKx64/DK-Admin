"use client";
import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getUsersByRole } from '@/services/pocketbase/readUsers';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import pb from '@/services/pocketbase';

/**
 * TechnicianSelector - Component for selecting a technician to assign to an order
 *
 * @param {Object} props
 * @param {string} props.value - Currently selected technician ID
 * @param {Function} props.onValueChange - Callback when technician selection changes
 * @param {string} props.label - Label for the selector
 * @param {boolean} props.disabled - Whether the selector is disabled
 */
const TechnicianSelector = ({
  value,
  onValueChange,
  label = "Assign Technician",
  disabled = false
}) => {
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTechnicians = async () => {
      setIsLoading(true);
      try {
        const techniciansList = await getUsersByRole('technician');
        setTechnicians(techniciansList);
      } catch (err) {
        console.error('Error fetching technicians:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTechnicians();
  }, []);

  // Function to get avatar URL
  const getAvatarUrl = (technician) => {
    if (!technician.avatar) return null;
    return pb.files.getUrl(technician, technician.avatar, { thumb: '100x100' });
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Error loading technicians: {error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? "Loading technicians..." : "Select a technician"} />
        </SelectTrigger>
        <SelectContent>
          {technicians.length === 0 && !isLoading ? (
            <div className="px-2 py-4 text-sm text-center text-muted-foreground">
              No technicians available
            </div>
          ) : (
            <>
              <SelectItem value="unassign">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Unassign</span>
                </div>
              </SelectItem>
              {technicians.map((technician) => (
                <SelectItem key={technician.id} value={technician.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getAvatarUrl(technician)} />
                      <AvatarFallback className="text-xs">
                        {getInitials(technician.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{technician.name}</span>
                      <span className="text-xs text-muted-foreground">{technician.email}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TechnicianSelector;
