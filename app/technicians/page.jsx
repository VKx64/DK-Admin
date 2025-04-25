"use client";
import Header from '@/components/v1/technicians/Header';
import { useState, useRef, useEffect } from 'react';
import React from 'react';
import DataTable from '@/components/v1/technicians/DataTable';
import pb from '@/services/pocketbase';

const Page = () => {
  // State for managing search query and technician data
  const [searchQuery, setSearchQuery] = useState("");
  const [technicians, setTechnicians] = useState([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch technicians on initial load
  useEffect(() => {
    fetchTechnicians();
  }, []);

  // Filter technicians when search query changes
  useEffect(() => {
    if (technicians.length > 0) {
      filterTechnicians();
    }
  }, [searchQuery, technicians]);

  // Handle search changes from the header
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle refresh from header
  const handleRefresh = () => {
    fetchTechnicians();
  };

  // Filter technicians based on search query
  const filterTechnicians = () => {
    if (!searchQuery) {
      setFilteredTechnicians(technicians);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = technicians.filter(technician =>
      (technician.name && technician.name.toLowerCase().includes(query)) ||
      (technician.email && technician.email.toLowerCase().includes(query)) ||
      (technician.technician_details?.job_title && technician.technician_details.job_title.toLowerCase().includes(query)) ||
      (technician.technician_details?.preferred_job_type && technician.technician_details.preferred_job_type.toLowerCase().includes(query))
    );

    setFilteredTechnicians(filtered);
  };

  // Fetch technicians data using PocketBase SDK
  const fetchTechnicians = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch users with technician role and expand the technician_details relation
      const resultList = await pb.collection('users').getList(1, 100, {
        filter: 'role = "technician"',
        expand: 'technician_details',
      });

      // Map the response to our expected data format
      const mappedTechnicians = resultList.items.map(tech => {
        // Extract technician details if they exist
        const techDetails = tech.expand?.technician_details?.[0] || null;

        return {
          id: tech.id,
          name: tech.name || "Unnamed Technician",
          email: tech.email,
          avatar: tech.avatar ? `${process.env.NEXT_PUBLIC_PB_FILE_URL}/${tech.collectionId}/${tech.id}/${tech.avatar}` : null,
          role: tech.role,
          technician_details: techDetails ? {
            id: techDetails.id,
            job_title: techDetails.job_title,
            years_of_experience: techDetails.years_of_experience,
            specialization: techDetails.specialization,
            days_availability: techDetails.days_availability,
            hours_availability: techDetails.hours_availability,
            preferred_job_type: techDetails.preferred_job_type,
            resume_image: techDetails.resume_image ? `${process.env.NEXT_PUBLIC_PB_FILE_URL}/technician_details/${techDetails.id}/${techDetails.resume_image}` : null
          } : null
        };
      });

      setTechnicians(mappedTechnicians);
      setFilteredTechnicians(mappedTechnicians);
    } catch (err) {
      setError("An error occurred while fetching technicians");
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] gap-4 flex flex-col'>
      <Header
        onSearchChange={handleSearch}
        onRefresh={handleRefresh}
      />

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {error}. <button className="underline" onClick={fetchTechnicians}>Try again</button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center bg-white p-8 rounded-md">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-600">Loading technicians...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Main content when data is loaded */}
          <div className="flex-1 flex flex-col">
            {/* Table with technician data */}
            <DataTable data={filteredTechnicians} />
          </div>

          {/* Show count of technicians */}
          <div className="text-sm text-gray-500 pl-2">
            {filteredTechnicians.length} technician{filteredTechnicians.length !== 1 ? 's' : ''} found
          </div>
        </>
      )}
    </div>
  );
};

export default Page;