import { Icon } from '@iconify/react'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ItemNavigation = ({ icon, text, href }) => {
  const pathname = usePathname();

  // Determine if this navigation item is active based on the current path
  const isActive = () => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <Link href={href} className="w-full">
      <div className={`flex flex-row gap-2.5 items-start justify-start p-2 ${isActive() ? 'bg-[#5CCFBC]' : 'hover:bg-[#5CCFBC]'} rounded-sm cursor-pointer`}>
        <Icon icon={icon} className='text-white text-2xl' />
        <h1 className='font-raleway font-semibold text-base text-white'>{text}</h1>
      </div>
    </Link>
  )
}

export default ItemNavigation