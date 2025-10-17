"use client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icon } from "@iconify/react";
import pb from "@/services/pocketbase";

const Filters = ({
  searchQuery,
  onSearchChange,
  selectedBranch,
  onBranchChange,
  userRole
}) => {
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Fetch branches for super-admin filter
  useEffect(() => {
    const fetchBranches = async () => {
      if (userRole !== 'super-admin') return;

      setLoadingBranches(true);
      try {
        const result = await pb.collection("branch_details").getFullList({
          sort: 'branch_name',
          requestKey: null
        });
        setBranches(result);
      } catch (error) {
        console.error("Error fetching branches:", error);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [userRole]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Icon
          icon="material-symbols:search"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"
        />
        <Input
          type="text"
          placeholder="Search customers by name or email..."
          value={searchQuery}
          onChange={onSearchChange}
          className="pl-10 w-full"
        />
      </div>

      {/* Branch Filter - Only for Super Admin */}
      {userRole === 'super-admin' && (
        <div className="w-full sm:w-[250px]">
          <Select value={selectedBranch} onValueChange={onBranchChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by last order branch..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              <SelectItem value="no-orders">No Orders Yet</SelectItem>
              {loadingBranches ? (
                <SelectItem value="loading" disabled>
                  Loading branches...
                </SelectItem>
              ) : (
                branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.branch_name || `Branch ${branch.id.substring(0, 8)}`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default Filters;
