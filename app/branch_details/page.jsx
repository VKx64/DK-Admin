"use client";
import React, { useState, useRef } from "react";
import BranchDetailsInput from "@/components/v1/branch_details/BranchDetailsInput";
import BranchDetailsOutput from "@/components/v1/branch_details/BranchDetailsOutput";

const BranchDetailsPage = () => {
  const [editingBranch, setEditingBranch] = useState(null);
  // refreshKey is used to trigger a re-fetch in BranchDetailsOutput
  const [refreshKey, setRefreshKey] = useState(0);
  const inputFormRef = useRef(null); // Ref to scroll to the form

  const handleEditRequest = (branch) => {
    setEditingBranch(branch);
    // Scroll to the input form when edit is clicked
    if (inputFormRef.current) {
      inputFormRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleFormSubmission = () => {
    setEditingBranch(null); // Clear the editing state
    setRefreshKey((prevKey) => prevKey + 1); // Increment key to trigger refresh
  };

  return (
    <main className="p-4 md:p-6 lg:p-8 w-full overflow-auto">
      <div ref={inputFormRef} className="mb-10">
        {/* Pass editingBranch and the submission handler to the input component */}
        <BranchDetailsInput
          branchToEdit={editingBranch}
          onFormSubmitted={handleFormSubmission}
        />
      </div>

      <hr className="my-8 border-gray-300" />

      {/* Pass the edit request handler and refreshKey to the output component */}
      <BranchDetailsOutput
        onEditClick={handleEditRequest}
        refreshKey={refreshKey}
      />
    </main>
  );
};

export default BranchDetailsPage;
