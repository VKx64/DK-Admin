import { Icon } from '@iconify/react'
import React from 'react'
import Link from 'next/link'

const ItemNavigation = ({ icon, text, isActive = false }) => {
  // Generate the href based on the text (lowercase and handle Home special case)
  const href = text === 'Home' ? '/' : `/${text.toLowerCase()}`

  return (
    <Link href={href} className="w-full">
      <div className={`flex flex-row gap-2.5 items-start justify-start p-2 ${isActive ? 'bg-[#5CCFBC]' : 'hover:bg-[#5CCFBC]'} rounded-sm cursor-pointer`}>
        <Icon icon={icon} className='text-white text-2xl' />
        <h1 className='font-raleway font-semibold text-base text-white'>{text}</h1>
      </div>
    </Link>
  )
}

export default ItemNavigation