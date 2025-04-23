"use client";
import React, { useState, useEffect } from 'react'
import UserDetails from './UserDetails'
import { Button } from "@/components/ui/button"
import ItemNavigation from './ItemNavigation'
import { usePathname } from 'next/navigation'

const SideNavigation = () => {
  const pathname = usePathname();

  // Improved function to determine if a navigation item is active
  const isActive = (text) => {
    const path = text.toLowerCase();
    if (text === 'Home') return pathname === '/';
    return pathname === `/${path}` || pathname.startsWith(`/${path}/`);
  };

  return (
    <div className='w-1/6 bg-[#0A1727] flex flex-col items-center pt-12 pb-3 px-5 gap-6'>

      {/* User Details */}
      <UserDetails />

      {/* Divider */}
      <div className='w-full h-[1px] bg-white/10' />

      {/* Navigation Links */}
      <div className='w-full h-full flex flex-col gap-1'>
        <ItemNavigation icon={"mingcute:calendar-day-line"} text={"Home"} isActive={isActive('Home')}/>
        <ItemNavigation icon={"mingcute:settings-3-line"} text={"Parts"} isActive={isActive('Parts')}/>
        <ItemNavigation icon={"mingcute:receive-money-line"} text={"Orders"} isActive={isActive('Orders')}/>
        <ItemNavigation icon={"mingcute:air-condition-open-line"} text={"Products"} isActive={isActive('Products')}/>
        <ItemNavigation icon={"mingcute:user-heart-line"} text={"Customers"} isActive={isActive('Customers')}/>
        <ItemNavigation icon={"mingcute:user-setting-line"} text={"Technicians"} isActive={isActive('Technicians')}/>
      </div>

      {/* Divider */}
      <div className='w-full h-[1px] bg-white/10' />

      {/* Logout Button */}
      <Button variant="destructive" size={"lg"} className={"w-full text-base"}>Logout</Button>
    </div>
  )
}

export default SideNavigation