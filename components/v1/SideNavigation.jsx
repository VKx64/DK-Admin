"use client";
import React, { useState, useEffect } from 'react'
import UserDetails from './UserDetails'
import { Button } from "@/components/ui/button"
import ItemNavigation from './ItemNavigation'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'; // Import useAuth

const SideNavigation = () => {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const { logout, user } = useAuth(); // Get logout function and user from context

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isActive = (href) => {
    if (!isMounted) return false;

    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Define role-based visibility with null check for user
  const isAdmin = user?.role === 'admin';
  // Add other roles as needed, e.g., const isTechnician = user?.role === 'technician';

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
    <div className='w-1/6 bg-[#0A1727] flex flex-col items-center pt-12 pb-3 px-5 gap-6'>

      <UserDetails />

      <div className='w-full h-[1px] bg-white/10' />

      <div className='w-full h-full flex flex-col gap-1'>
        {/* Always visible */}
        <ItemNavigation icon={"mingcute:calendar-day-line"} text={"Home"} href={'/'} isActive={isActive('/')}/>

        {/* Admin or specific roles */}
        {(isAdmin /* || isTechnician */) && <ItemNavigation icon={"mingcute:settings-3-line"} text={"Parts"} href={'/parts'} isActive={isActive('/parts')}/>}
        {(isAdmin /* || isTechnician */) && <ItemNavigation icon={"mingcute:settings-3-line"} text={"Parts Log"} href={'/parts_history'} isActive={isActive('/parts_history')}/>}
        {(isAdmin /* || isTechnician */) && <ItemNavigation icon={"mingcute:receive-money-line"} text={"Orders"} href={'/orders'} isActive={isActive('/orders')}/>}
        {isAdmin && <ItemNavigation icon={"mingcute:air-condition-open-line"} text={"Products"} href={'/products'} isActive={isActive('/products')}/>}
        {isAdmin && <ItemNavigation icon={"mingcute:user-heart-line"} text={"Customers"} href={'/customers'} isActive={isActive('/customers')}/>}
        {isAdmin && <ItemNavigation icon={"mingcute:user-setting-line"} text={"Technicians"} href={'/technicians'} isActive={isActive('/technicians')}/>}
        {(isAdmin /* || isTechnician */) && <ItemNavigation icon={"mingcute:user-setting-line"} text={"Service"} href={'/service'} isActive={isActive('/service')}/>}
      </div>

      <div className='w-full h-[1px] bg-white/10' />

      <Button variant="destructive" size={"lg"} className={"w-full text-base"} onClick={handleLogout}>Logout</Button>
    </div>
  )
}

export default SideNavigation