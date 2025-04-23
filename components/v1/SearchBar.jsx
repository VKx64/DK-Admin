import { Icon } from '@iconify/react'
import React from 'react'

const SearchBar = () => {
  return (
    <div className='bg-[#EFEFEF] rounded-sm pl-3 flex flex-row items-center gap-3'>
      <Icon icon="mingcute:search-2-line" className='text-2xl text-[#878787]'/>
      <input type="text" placeholder='Search...' className='bg-[#EFEFEF] text-[#878787] font-raleway font-medium text-base outline-none w-full placeholder:text-[#878787]' />
    </div>
  )
}

export default SearchBar