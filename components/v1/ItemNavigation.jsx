import { Icon } from '@iconify/react'
import React from 'react'

const ItemNavigation = ({ icon, text }) => {
  return (
    <div className='flex flex-row gap-2.5 items-start justify-start p-2 hover:bg-[#5CCFBC] rounded-sm'>
      <Icon icon={icon} className='text-white text-2xl' />
      <h1 className='font-raleway font-semibold text-base text-white'>{text}</h1>
    </div>
  )
}

export default ItemNavigation