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

const Filters = ({
  searchQuery = "",
  onSearchChange,
  onPriceSortChange,
  onStockSortChange,
  onDiscountSortChange,
  onCategoryChange,
  uniqueCategories = [],
  userRole
}) => {
  // If no categories are provided, use these defaults (this will be removed once dynamic categories are working)
  const defaultCategories = ["HVAC", "Air Conditioning", "Ventilation", "Accessories", "Control Systems"];

  // Use the provided categories if available, otherwise fall back to defaults
  const categoryOptions = uniqueCategories.length > 0 ? uniqueCategories : defaultCategories;

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
          <p className="font-raleway font-medium text-xs text-[#3D3D3D]">Price</p>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onPriceSortChange('lowToHigh')}>
            Lowest to Highest
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPriceSortChange('highToLow')}>
            Highest to Lowest
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onPriceSortChange('')}>
            Clear Filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Stock Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-row items-center gap-2.5 bg-[#EFEFEF] rounded-sm px-3 py-2">
          <p className="font-raleway font-medium text-xs text-[#3D3D3D]">Stock</p>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onStockSortChange('lowToHigh')}>
            Lowest to Highest
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStockSortChange('highToLow')}>
            Highest to Lowest
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onStockSortChange('')}>
            Clear Filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Discount Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-row items-center gap-2.5 bg-[#EFEFEF] rounded-sm px-3 py-2" disabled={userRole !== 'super-admin'}>
          <p className="font-raleway font-medium text-xs text-[#3D3D3D]">Discount</p>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onDiscountSortChange('lowToHigh')} disabled={userRole !== 'super-admin'}>
            Lowest to Highest
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDiscountSortChange('highToLow')} disabled={userRole !== 'super-admin'}>
            Highest to Lowest
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDiscountSortChange('')} disabled={userRole !== 'super-admin'}>
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
          {categoryOptions.map((category) => (
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
