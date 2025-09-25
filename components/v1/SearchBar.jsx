import { Icon } from '@iconify/react'
import React from 'react'

const SearchBar = ({ onSearchChange, placeholder = "Search..." }) => {
  return (
    <div className='bg-[#EFEFEF] rounded-sm pl-3 pr-3 py-2 flex flex-row items-center gap-3 min-w-[300px]'>
      <Icon icon="mingcute:search-2-line" className='text-2xl text-[#878787]'/>
      <input
        type="text"
        placeholder={placeholder}
        className='bg-[#EFEFEF] text-[#878787] font-raleway font-medium text-base outline-none w-full placeholder:text-[#878787]'
        onChange={onSearchChange}
      />
    </div>
  )
}

export default SearchBar