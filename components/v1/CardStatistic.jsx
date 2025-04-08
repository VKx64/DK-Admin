import React from 'react'

const CardStatistic = ({ title, value }) => {
  return (
    <div className='flex flex-col p-4 bg-white shadow-sm w-fit h-fit rounded-sm'>
      <p className='font-raleway font-semibold text-base text-[#818181]'>{title}</p>
      <h1 className='font-semibold text-2xl text-[#3D3D3D]'>{value}</h1>
    </div>
  )
}

export default CardStatistic