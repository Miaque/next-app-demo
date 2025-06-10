'use client'

import { BlogForm } from '@/components/blog-form'
import { Button } from '@/components/ui/button'
import { useRef } from 'react'
import { BlogRef } from '@/types/demo'

export default function Page() {
  const ref = useRef<BlogRef>(null)

  const handleClick = async () => {
    if (ref.current) {
      const { valid, values } = await ref.current.validate()
      console.log(valid, values)
    }
  }

  return (
    <>
      <Button onClick={handleClick}>点击</Button>
      <div className="container flex justify-center">
        <BlogForm ref={ref}></BlogForm>
      </div>
    </>
  )
}
