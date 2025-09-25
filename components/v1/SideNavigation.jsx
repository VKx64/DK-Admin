"use client";
import React from 'react'
import UserDetails from './UserDetails'
import { Button } from "@/components/ui/button"
import ItemNavigation from './ItemNavigation'
import { useAuth } from '@/context/AuthContext'; // Import useAuth

const SideNavigation = () => {
  const { logout, user } = useAuth(); // Get logout function and user from context

  // Define role-based visibility with null check for user
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';
  const isSuperAdmin = user?.role === 'super-admin';

  const handleLogout = () => {
    // Prevent any potential errors during logout process
    try {
      logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Optionally add fallback navigation if needed
    }
  };

  return (
    <div className='w-1/6 bg-[#0A1727] flex flex-col items-center pt-12 pb-3 px-5 gap-6 fixed left-0 top-0 h-screen overflow-y-auto'>

      <UserDetails />

      <div className='w-full h-[1px] bg-white/10' />

      <div className='w-full h-full flex flex-col gap-1'>

        {/* Home - visible for non-technician roles */}
        {!isTechnician && <ItemNavigation icon={"mingcute:calendar-day-line"} text={"Home"} href={'/'} />}

        {/* Technician Role */}
        {(isTechnician) && <ItemNavigation icon={"mingcute:calendar-day-line"} text={"My Details"} href={'/technitian_information'} />}

        {/* Super Admin Role */}
        {(isSuperAdmin) && <ItemNavigation icon={"mingcute:calendar-day-line"} text={"Branch"} href={'/branch'} />}
        {(isSuperAdmin) && <ItemNavigation icon={"mingcute:basket-2-line"} text={"Branch Details"} href={'/branch_details'} />}

        {/* Admin Role */}
        {(isAdmin) && <ItemNavigation icon={"mingcute:basket-2-line"} text={"My Branch"} href={'/branch_details'} />}
        {(isAdmin) && <ItemNavigation icon={"mingcute:settings-3-line"} text={"Parts"} href={'/parts'} />}
        {(isAdmin) && <ItemNavigation icon={"mingcute:settings-3-line"} text={"Parts Log"} href={'/parts_history'} />}
        {(isAdmin || isSuperAdmin) && <ItemNavigation icon={"mingcute:receive-money-line"} text={"Orders"} href={'/orders'} />}
        {(isAdmin || isSuperAdmin) && <ItemNavigation icon={"mingcute:air-condition-open-line"} text={"Products"} href={'/products'} />}
        {(isAdmin || isSuperAdmin) && <ItemNavigation icon={"mingcute:user-heart-line"} text={"Customers"} href={'/customers'} />}
        {(isAdmin || isSuperAdmin) && <ItemNavigation icon={"mingcute:user-setting-line"} text={"Technicians"} href={'/technicians'} />}

        {/* Combined Role */}
        {(isAdmin || isTechnician) && <ItemNavigation icon={"mingcute:user-setting-line"} text={"Service"} href={'/service'} />}
        {(isAdmin || isSuperAdmin) && <ItemNavigation icon={"mingcute:history-line"} text={"Service History"} href={'/service_history'} />}
        {(isAdmin || isSuperAdmin) && <ItemNavigation icon={"mingcute:chart-line-line"} text={"Analytics"} href={'/analytics'} />}

      </div>

      <div className='w-full h-[1px] bg-white/10' />

      <Button variant="destructive" size={"lg"} className={"w-full text-base"} onClick={handleLogout}>Logout</Button>
    </div>
  )
}

export default SideNavigation