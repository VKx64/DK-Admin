"use client";
import React, { useState, useEffect } from "react";
import pb from "@/services/pocketbase";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";

const BranchDetailsInput = () => {
  const { user } = useAuth();
  const [branchDetails, setBranchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [branchName, setBranchName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [branchImage, setBranchImage] = useState(null);
  const [branchEmail, setBranchEmail] = useState("");
  const [branchLatitude, setBranchLatitude] = useState("");
  const [branchLongitude, setBranchLongitude] = useState("");
  const [branchImagePreview, setBranchImagePreview] = useState(null);

  const isSuperAdmin = user?.role === "super-admin";
  const isAdmin = user?.role === "admin";

  // Fetch branch details when user is available
  useEffect(() => {
    const fetchBranchDetails = async () => {
      if (!user?.id) return; // Don't fetch if no user

      setLoading(true);
      try {
        let result;

        if (isSuperAdmin) {
          // Super admin can see all branch details
          result = await pb.collection("branch_details").getFullList({
            requestKey: null
          });
        } else if (isAdmin) {
          // Regular admin can only see their own branch details
          result = await pb.collection("branch_details").getFullList({
            filter: `user_id="${user.id}"`,
            requestKey: null
          });
        }

        if (result && result.length > 0) {
          setBranchDetails(result[0]); // For individual view, take first result
        } else {
          setBranchDetails(null);
        }
      } catch (error) {
        console.error("Error fetching branch details:", error);
        setBranchDetails(null);
      }
      setLoading(false);
    };

    fetchBranchDetails();
  }, [user, isSuperAdmin, isAdmin]); // Add role dependencies

  // Fill form fields when entering edit mode
  useEffect(() => {
    if (editMode && branchDetails) {
      setBranchName(branchDetails.branch_name || "");
      setManagerName(branchDetails.manager_name || "");
      setBranchEmail(branchDetails.branch_email || "");
      setBranchLatitude(branchDetails.branch_latitude || "");
      setBranchLongitude(branchDetails.branch_longitude || "");
      setBranchImage(null); // Reset image input
      setBranchImagePreview(null); // Reset image preview
    }
  }, [editMode, branchDetails]);

  // Update image input handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setBranchImage(file);
    if (file) {
      setBranchImagePreview(URL.createObjectURL(file));
    } else {
      setBranchImagePreview(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user?.id) {
      alert("User not authenticated");
      return;
    }

    const formData = new FormData();
    formData.append("branch_name", branchName);
    formData.append("manager_name", managerName);
    if (branchImage) {
      formData.append("branch_image", branchImage);
    }
    formData.append("branch_email", branchEmail);
    formData.append("user_id", user.id); // Fixed: Change admin_id to user_id

    const lat = parseFloat(branchLatitude);
    const lon = parseFloat(branchLongitude);
    if (!isNaN(lat)) formData.append("branch_latitude", lat);
    if (!isNaN(lon)) formData.append("branch_longitude", lon);

    try {
      if (editMode && branchDetails) {
        // Update existing branch
        await pb
          .collection("branch_details")
          .update(branchDetails.id, formData, { requestKey: null });
      } else {
        // Create new branch
        await pb.collection("branch_details").create(formData, {
          requestKey: null
        });
      }
      // Fetch and display the new details
      if (isSuperAdmin) {
        const result = await pb.collection("branch_details").getFullList({
          requestKey: null
        });
        setBranchDetails(result[0]);
      } else {
        const result = await pb.collection("branch_details").getFullList({
          filter: `user_id="${user.id}"`,
          requestKey: null
        });
        setBranchDetails(result[0]);
      }
      setEditMode(false);
    } catch (error) {
      console.error("Error submitting branch details:", error);
      alert("Failed to submit branch details.");
    }
  };

  // Show loading if no user or still loading
  if (!user || loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Check permissions
  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 max-w-2xl">
        <div className="text-center">
          <Icon icon="mdi:lock" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">
            You don't have permission to manage branch details.
          </p>
        </div>
      </div>
    );
  }

  // If branch details exist and not in edit mode, display them with edit button
  if (branchDetails && !editMode) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Branch Details</h2>
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow transition"
            title="Edit"
          >
            <Icon icon="mdi:pencil" width="22" height="22" />
            Edit
          </button>
        </div>
        <div className="divide-y divide-gray-200">
          <div className="py-2 flex items-center">
            <span className="w-40 font-medium text-gray-600">Branch Name:</span>
            <span className="text-gray-900">{branchDetails.branch_name}</span>
          </div>
          <div className="py-2 flex items-center">
            <span className="w-40 font-medium text-gray-600">
              Manager Name:
            </span>
            <span className="text-gray-900">{branchDetails.manager_name}</span>
          </div>
          <div className="py-2 flex items-center">
            <span className="w-40 font-medium text-gray-600">
              Branch Email:
            </span>
            <span className="text-gray-900">{branchDetails.branch_email}</span>
          </div>
          <div className="py-2 flex items-center">
            <span className="w-40 font-medium text-gray-600">Latitude:</span>
            <span className="text-gray-900">
              {branchDetails.branch_latitude}
            </span>
          </div>
          <div className="py-2 flex items-center">
            <span className="w-40 font-medium text-gray-600">Longitude:</span>
            <span className="text-gray-900">
              {branchDetails.branch_longitude}
            </span>
          </div>
          {branchDetails.branch_image && (
            <div className="py-4 flex flex-col">
              <span className="font-medium text-gray-600 mb-2">Image:</span>
              <img
                src={pb.files.getUrl(branchDetails, branchDetails.branch_image)}
                alt="Branch"
                className="rounded-xl shadow border border-gray-200 max-w-xs"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show the form (for create or edit)
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {editMode ? "Edit Branch" : "Add New Branch"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="branchNameInput"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Branch Name
          </label>
          <input
            type="text"
            id="branchNameInput"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm transition"
            required
          />
        </div>
        <div>
          <label
            htmlFor="managerNameInput"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Manager Name
          </label>
          <input
            type="text"
            id="managerNameInput"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm transition"
            required
          />
        </div>
        <div>
          <label
            htmlFor="branchEmailInput"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Branch Email
          </label>
          <input
            type="email"
            id="branchEmailInput"
            value={branchEmail}
            onChange={(e) => setBranchEmail(e.target.value)}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm transition"
            required
          />
        </div>
        <div>
          <label
            htmlFor="branchImageInput"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Branch Image
          </label>
          <input
            type="file"
            id="branchImageInput"
            onChange={handleImageChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer transition"
            accept="image/*"
          />
          {branchImagePreview && (
            <img
              src={branchImagePreview}
              alt="Preview"
              className="mt-3 rounded-xl shadow border border-gray-200 max-w-xs"
            />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="branchLatitudeInput"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Branch Latitude
            </label>
            <input
              type="number"
              id="branchLatitudeInput"
              value={branchLatitude}
              onChange={(e) => setBranchLatitude(e.target.value)}
              step="any"
              className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm transition"
              required
            />
          </div>
          <div>
            <label
              htmlFor="branchLongitudeInput"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Branch Longitude
            </label>
            <input
              type="number"
              id="branchLongitudeInput"
              value={branchLongitude}
              onChange={(e) => setBranchLongitude(e.target.value)}
              step="any"
              className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm transition"
              required
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
          >
            {editMode ? "Save Changes" : "Submit Branch Details"}
          </button>
          {editMode && (
            <button
              type="button"
              className="flex-1 flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition"
              onClick={() => setEditMode(false)}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default BranchDetailsInput;
