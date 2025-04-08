import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input"
import { Icon } from "@iconify/react";

const Filters = ({ searchQuery = "", onSearchChange, onPriceSortChange, onCategoryChange }) => {
  // Define category options (for filtering)
  const categories = ["HVAC", "Air Conditioning", "Ventilation", "Accessories", "Control Systems"]

  return (
    <div className="flex flex-row gap-4">
      <Input
        type="text"
        placeholder="Search for Product"
        value={searchQuery}
        onChange={onSearchChange}
        className={"items-center bg-[#EFEFEF] rounded-sm font-raleway"}
      />

      {/* Price Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-row items-center gap-2.5 bg-[#EFEFEF] rounded-sm px-3 py-2">
          <p className="font-raleway font-medium text-xs text-[#3D3D3D]">Filters</p>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onPriceSortChange('lowToHigh')}>
            Price Lowest to Highest
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPriceSortChange('highToLow')}>
            Price Highest to Lowest
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onPriceSortChange('')}>
            Clear Filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Category Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-row items-center gap-2.5 bg-[#EFEFEF] rounded-sm px-3 py-2">
          <p className="font-raleway font-medium text-xs text-[#3D3D3D]">Category</p>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {categories.map((category) => (
            <DropdownMenuItem key={category} onClick={() => onCategoryChange(category)}>
              {category}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onCategoryChange('')}>
            Clear Filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Filters;
