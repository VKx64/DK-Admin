"use client";
import React, { useState, useEffect } from "react";
import pb from "@/services/pocketbase";

const BranchDetailsInput = ({ branchToEdit, onFormSubmitted }) => {
  const [branchName, setBranchName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [branchImage, setBranchImage] = useState(null);
  const [branchEmail, setBranchEmail] = useState("");
  const [branchLatitude, setBranchLatitude] = useState("");
  const [branchLongitude, setBranchLongitude] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (branchToEdit) {
      setIsEditing(true);
      setBranchName(branchToEdit.branch_name || "");
      setManagerName(branchToEdit.manager_name || "");
      setBranchEmail(branchToEdit.branch_email || "");
      setBranchLatitude(branchToEdit.branch_latitude?.toString() || "");
      setBranchLongitude(branchToEdit.branch_longitude?.toString() || "");
      setBranchImage(null); // Reset image input, user must re-select if they want to change it
    } else {
      setIsEditing(false);
      // Reset form to default for new entry
      setBranchName("");
      setManagerName("");
      setBranchEmail("");
      setBranchLatitude("");
      setBranchLongitude("");
      setBranchImage(null);
    }
  }, [branchToEdit]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("branch_name", branchName);
    formData.append("manager_name", managerName);
    if (branchImage) {
      formData.append("branch_image", branchImage);
    }
    formData.append("branch_email", branchEmail);
    const lat = parseFloat(branchLatitude);
    const lon = parseFloat(branchLongitude);
    formData.append("branch_latitude", !isNaN(lat) ? lat : null);
    formData.append("branch_longitude", !isNaN(lon) ? lon : null);

    try {
      if (isEditing && branchToEdit) {
        await pb.collection("branch_details").update(branchToEdit.id, formData);
        alert("Branch details updated successfully!");
      } else {
        await pb.collection("branch_details").create(formData);
        alert("Branch details submitted successfully!");
      }

      // Reset form fields and editing state
      setBranchName("");
      setManagerName("");
      setBranchImage(null);
      setBranchEmail("");
      setBranchLatitude("");
      setBranchLongitude("");
      setIsEditing(false); // Explicitly set back to not editing
      const fileInput = document.getElementById("branchImageInput");
      if (fileInput) {
        fileInput.value = "";
      }
      if (onFormSubmitted) {
        onFormSubmitted(); // Notify parent
      }
    } catch (error) {
      console.error("Failed to submit branch details:", error);
      let errorMessage = `Failed to ${
        isEditing ? "update" : "submit"
      } branch details. Please try again.`;
      if (error.data && error.data.data) {
        const fieldErrors = Object.entries(error.data.data)
          .map(([field, err]) => `${field}: ${err.message}`)
          .join("\n");
        errorMessage += `\nDetails:\n${fieldErrors}`;
      } else if (error.message) {
        errorMessage += `\nError: ${error.message}`;
      }
      alert(errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setBranchName("");
    setManagerName("");
    setBranchImage(null);
    setBranchEmail("");
    setBranchLatitude("");
    setBranchLongitude("");
    if (onFormSubmitted) {
      // Notify parent to clear editing state
      onFormSubmitted();
    }
  };

  return (
    <div className="bg-gray-50 p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        {isEditing ? "Edit Branch" : "Add New Branch"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="branchNameInput"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Branch Name
          </label>
          <input
            type="text"
            id="branchNameInput"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
            required
          />
        </div>

        <div>
          <label
            htmlFor="managerNameInput"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Manager Name
          </label>
          <input
            type="text"
            id="managerNameInput"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
            required
          />
        </div>

        <div>
          <label
            htmlFor="branchEmailInput"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Branch Email
          </label>
          <input
            type="email"
            id="branchEmailInput"
            value={branchEmail}
            onChange={(e) => setBranchEmail(e.target.value)}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
            required
          />
        </div>

        <div>
          <label
            htmlFor="branchImageInput"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Branch Image {isEditing && "(Leave blank to keep existing)"}
          </label>
          <input
            type="file"
            id="branchImageInput"
            onChange={(e) => setBranchImage(e.target.files[0])}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer transition duration-150 ease-in-out"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="branchLatitudeInput"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Branch Latitude
            </label>
            <input
              type="number"
              id="branchLatitudeInput"
              value={branchLatitude}
              onChange={(e) => setBranchLatitude(e.target.value)}
              step="any"
              className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
              required
            />
          </div>

          <div>
            <label
              htmlFor="branchLongitudeInput"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Branch Longitude
            </label>
            <input
              type="number"
              id="branchLongitudeInput"
              value={branchLongitude}
              onChange={(e) => setBranchLongitude(e.target.value)}
              step="any"
              className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
              required
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          >
            {isEditing ? "Update Branch" : "Submit Branch Details"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
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
