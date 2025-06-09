"use client";
import React, { useState, useRef } from "react";
import BranchDetailsInput from "@/components/v1/branch_details/BranchDetailsInput";

const BranchDetailsPage = () => {
  const [editingBranch, setEditingBranch] = useState(null);
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
  };

  return (
    <main className="p-4 md:p-6 lg:p-8 w-full overflow-auto">
      <div ref={inputFormRef} className="mb-10">
        <BranchDetailsInput
          branchToEdit={editingBranch}
          onFormSubmitted={handleFormSubmission}
        />
      </div>
    </main>
  );
};

export default BranchDetailsPage;
