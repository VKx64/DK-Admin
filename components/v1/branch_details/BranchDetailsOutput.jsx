"use client";
import React, { useState, useEffect } from "react";
import pb from "@/services/pocketbase";
import { Icon } from "@iconify/react";

// Add onEditClick to props
const BranchDetailsOutput = ({ onEditClick, refreshKey }) => {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBranches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await pb.collection("branch_details").getFullList({
        sort: "-created",
      });
      setBranches(records);
    } catch (err) {
      console.error("Failed to fetch branch details:", err);
      setError(
        err.message || "An error occurred while fetching branch details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add refreshKey to dependency array to re-fetch when it changes
  useEffect(() => {
    fetchBranches();
  }, [refreshKey]);

  const handleDelete = async (branchId) => {
    if (window.confirm("Are you sure you want to delete this branch?")) {
      try {
        await pb.collection("branch_details").delete(branchId);
        // Instead of just filtering, re-fetch to ensure data consistency
        fetchBranches();
        alert("Branch deleted successfully!");
      } catch (err) {
        console.error("Failed to delete branch:", err);
        alert(`Failed to delete branch: ${err.message || "Unknown error"}`);
      }
    }
  };

  // handleEdit now calls the onEditClick prop with the full branch object
  const handleEdit = (branch) => {
    if (onEditClick) {
      onEditClick(branch);
    } else {
      console.warn("onEditClick prop not provided to BranchDetailsOutput");
      alert(
        `Edit functionality for branch ${branch.id} is not fully connected.`
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-gray-700">Loading branch details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative"
        role="alert"
      >
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="text-center py-10">
        <Icon
          icon="mdi:store-off-outline"
          className="mx-auto text-gray-400 text-6xl mb-4"
        />
        <p className="text-xl text-gray-500">No branch details found.</p>
        <p className="text-sm text-gray-400">
          Try adding a new branch using the form above.
        </p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Existing Branches
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl flex flex-col"
          >
            {branch.branch_image && (
              <div className="w-full h-48 overflow-hidden">
                <img
                  src={pb.files.getURL(branch, branch.branch_image, {
                    thumb: "300x200",
                  })}
                  alt={branch.branch_name || "Branch image"}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/300x200?text=Image+Not+Available";
                    e.target.classList.add("opacity-50");
                  }}
                />
              </div>
            )}
            <div className="p-5 flex-grow flex flex-col">
              <h3
                className="text-xl font-semibold text-gray-800 mb-2 truncate"
                title={branch.branch_name}
              >
                {branch.branch_name || "Unnamed Branch"}
              </h3>
              <div className="space-y-1 text-sm text-gray-600 mb-3 flex-grow">
                <p>
                  <Icon
                    icon="mdi:account-tie"
                    className="inline mr-2 text-gray-500"
                  />
                  <strong>Manager:</strong> {branch.manager_name || "N/A"}
                </p>
                <p>
                  <Icon
                    icon="mdi:email-outline"
                    className="inline mr-2 text-gray-500"
                  />
                  <strong>Email:</strong> {branch.branch_email || "N/A"}
                </p>
                <p>
                  <Icon
                    icon="mdi:map-marker-outline"
                    className="inline mr-2 text-gray-500"
                  />
                  <strong>Location:</strong> Lat:{" "}
                  {branch.branch_latitude || "N/A"}, Lng:{" "}
                  {branch.branch_longitude || "N/A"}
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-auto pt-2 border-t border-gray-200">
                Created: {new Date(branch.created).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-50 p-3 flex justify-end space-x-2 border-t border-gray-200">
              <button
                onClick={() => handleEdit(branch)} // Pass the whole branch object
                className="p-2 rounded-md text-blue-600 hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-150"
                aria-label="Edit branch"
                title="Edit Branch"
              >
                <Icon icon="mdi:pencil-circle-outline" width="22" height="22" />
              </button>
              <button
                onClick={() => handleDelete(branch.id)}
                className="p-2 rounded-md text-red-600 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-150"
                aria-label="Delete branch"
                title="Delete Branch"
              >
                <Icon icon="mdi:trash-can-outline" width="22" height="22" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BranchDetailsOutput;
