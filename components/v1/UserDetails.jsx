import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const UserDetails = () => {
  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="size-20">
        <AvatarImage src="/Images/default_user.jpg" />
        <AvatarFallback>KW</AvatarFallback>
      </Avatar>

      <div className="flex flex-col items-center">
        <h1 className="font-raleway text-white font-bold text-xl">Kaoruko Waguri</h1>
        <p className="font-raleway text-[#818181] text-base">[ admin ]</p>
      </div>
    </div>
  );
};

export default UserDetails;
