import React from 'react'
import UserDetails from './UserDetails'
import { Button } from "@/components/ui/button"
import ItemNavigation from './ItemNavigation'

const SideNavigation = () => {
  return (
    <div className='w-1/6 bg-[#0A1727] flex flex-col items-center pt-12 pb-3 px-5 gap-6'>

      {/* User Details */}
      <UserDetails />

      {/* Divider */}
      <div className='w-full h-[1px] bg-white/10' />

      {/* Navigation Links */}
      <div className='w-full h-full flex flex-col gap-1'>
        <ItemNavigation icon={"mingcute:calendar-day-line"} text={"Home"}/>
        <ItemNavigation icon={"mingcute:settings-3-line"} text={"Parts"}/>
        <ItemNavigation icon={"mingcute:receive-money-line"} text={"Orders"}/>
        <ItemNavigation icon={"mingcute:air-condition-open-line"} text={"Products"}/>
        <ItemNavigation icon={"mingcute:user-heart-line"} text={"Customers"}/>
        <ItemNavigation icon={"mingcute:user-setting-line"} text={"Technicians"}/>
      </div>

      {/* Divider */}
      <div className='w-full h-[1px] bg-white/10' />

      {/* Logout Button */}
      <Button variant="destructive" size={"lg"} className={"w-full text-base"}>Logout</Button>
    </div>
  )
}

export default SideNavigation