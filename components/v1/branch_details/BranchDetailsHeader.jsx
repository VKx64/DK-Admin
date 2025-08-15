"use client";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import NewBranchDetails from "./NewBranchDetails";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const BranchDetailsHeader = ({ onCreated }) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super-admin";

  return (
    <div className="w-full bg-white shadow-sm p-4 rounded-md flex flex-row justify-between items-center border">
      {/* Header Text and Icon */}
      <div className="flex flex-row gap-3 items-center w-fit">
        <Icon
          icon="mdi:office-building-cog"
          className="text-4xl text-[#1E1E1E]"
        />
        <div className="flex flex-col">
          <h1 className="font-raleway font-semibold text-2xl text-[#1E1E1E]">
            Branch Details Management
          </h1>
          <p className="text-sm text-gray-600">
            {isSuperAdmin
              ? "Manage all branch details across the system"
              : "Manage your branch details"
            }
          </p>
        </div>
      </div>

      {/* Action Button - Only show for super admin */}
      {isSuperAdmin && (
        <Button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
          size="lg"
        >
          <Icon icon="mdi:plus" className="h-5 w-5" />
          New Branch Details
        </Button>
      )}

      {/* Only render the dialog for super admin */}
      {isSuperAdmin && (
        <NewBranchDetails open={open} onOpenChange={setOpen} onCreated={onCreated} />
      )}
    </div>
  );
};

export default BranchDetailsHeader;
