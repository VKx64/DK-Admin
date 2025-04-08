import { Icon } from "@iconify/react";
import React from "react";
import SearchBar from "../SearchBar";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <div className="w-full bg-white shadow-sm p-4 rounded-sm flex flex-row">
      {/* Header Text and Icon */}
      <div className="flex flex-row gap-3 items-center w-full">
        <Icon
          icon="mingcute:air-condition-open-line"
          className="text-4xl text-[#1E1E1E]"
        />
        <h1 className="font-raleway font-semibold text-2xl text-[#1E1E1E]">
          Product Management
        </h1>
      </div>

      {/* Search bar and Add Button */}
      <div className="flex flex-row gap-3">
        <SearchBar />
        <Button size={"lg"} className={"bg-[#5CCFBC]"}>
          <Icon icon="mingcute:add-line" className="size-6" /> Add Product
        </Button>
      </div>
    </div>
  );
};

export default Header;
