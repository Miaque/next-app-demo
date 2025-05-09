import { HeroUIProvider } from '@heroui/system'
import React, { ReactNode } from 'react'
import { ToastProvider } from '@heroui/toast'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <HeroUIProvider locale='zh-CN'>
      <ToastProvider />
      {children}
    </HeroUIProvider>
  )
}
