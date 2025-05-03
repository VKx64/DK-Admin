import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext"; // Import useAuth for better state management

const UserDetails = () => {
  const { user } = useAuth(); // Use the user from context instead of direct pb access

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="size-20">
        <AvatarImage src="/Images/default_user.jpg" />
        <AvatarFallback>{user?.name?.substring(0, 2) || "NA"}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col items-center">
        <h1 className="font-raleway text-white font-bold text-xl">
          {user?.name || "Guest"}
        </h1>
        <p className="font-raleway text-[#818181] text-base">
          [ {user?.role || "Not logged in"} ]
        </p>
      </div>
    </div>
  );
};

export default UserDetails;
