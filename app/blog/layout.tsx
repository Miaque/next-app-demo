'use client'

import React from 'react'

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      Blog
      <section className='flex justify-center'>{children}</section>
    </>
  )
}
