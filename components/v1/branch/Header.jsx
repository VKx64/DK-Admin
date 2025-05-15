"use client";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import NewBranch from "./NewBranch";
import React, { useState } from "react";

const Header = ({ onCreated }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full bg-white shadow-sm p-4 rounded-sm flex flex-row justify-between items-center">
      {/* Header Text and Icon */}
      <div className="flex flex-row gap-3 items-center w-fit">
        <Icon
          icon="mdi:office-building"
          className="text-4xl text-[#1E1E1E]"
        />
        <h1 className="font-raleway font-semibold text-2xl text-[#1E1E1E]">
          Branch Management
        </h1>
      </div>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2" size="lg">
        <Icon icon="mdi:plus" className="h-5 w-5" />
        Create New Branch
      </Button>
      <NewBranch open={open} onOpenChange={setOpen} onCreated={onCreated} />
    </div>
  );
};

export default Header;