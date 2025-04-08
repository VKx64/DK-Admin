import CardStatistic from '@/components/v1/CardStatistic'
import Header from '@/components/v1/products/Header'
import ProductList from '@/components/v1/products/ProductList'
import React from 'react'

const page = () => {
  return (
    <div className='h-full w-full flex-1 px-5 py-3 bg-[#EAEFF8] gap-4 flex flex-col'>

      {/* Page Header */}
      <Header />

      {/* Products Table */}
      <ProductList />
    </div>
  )
}

export default page