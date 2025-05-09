'use client'

import { Button } from '@/components/ui/button'
import { addToast } from '@heroui/toast'

export default function Page() {
  function handleClick() {
    addToast({
      title: '标题',
      description: '描述',
      color: 'success',
      timeout: 3000,
      shouldShowTimeoutProgress: true,
    })
  }

  return (
    <>
      <h1>Hello Next.js!</h1>
      <Button onClick={handleClick}>click</Button>
    </>
  )
}
