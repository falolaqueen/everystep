import ColorPlayground from '@/component/ColorPlayground'
import Navbar from '@/component/Navbar'
import React from 'react'

const page = () => {
  return (
    <div className='p-12 mt-20'>
     <Navbar />
      <ColorPlayground />
    </div>
  )
}

export default page
