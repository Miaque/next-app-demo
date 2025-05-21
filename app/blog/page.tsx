'use client'

import { z, ZodType } from 'zod'
import { FormData } from '@/types/demo'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useEffect, useRef } from 'react'

const FormSchema: ZodType<FormData> = z
  .object({
    email: z.string().email('请输入你的邮箱'),
    name: z
      .string()
      .min(2, { message: 'Must be 2 or more characters long' })
      .max(10, { message: 'Must be 10 or fewer characters long' }),
    password: z
      .string()
      .min(8, { message: 'Password is too short' })
      .max(20, { message: 'Password is too long' }),
    confirmPassword: z.string(),
  })
  .refine((val) => val.password === val.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function Page() {
  const formRef = useRef<HTMLDivElement>(null)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
    },
  })

  function onSubmit(values: z.infer<typeof FormSchema>) {
    console.log(values)
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault()

    navigator.clipboard
      .readText()
      .then((text) => {
        console.log('全局捕获的粘贴文本：', JSON.parse(text))
      })
      .catch((err) => {
        console.error('读取剪贴板失败：', err)
      })
  }

  useEffect(() => {
    formRef.current?.addEventListener('paste', handlePaste)
    return () => formRef.current?.removeEventListener('paste', handlePaste)
  }, [])

  return (
    <div ref={formRef}>
      <ul>表单</ul>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={'space-y-8'}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>邮箱</FormLabel>
                <FormControl>
                  <Input placeholder="xxx@xxx.com" {...field} />
                </FormControl>
                <FormDescription>你的邮箱</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>姓名</FormLabel>
                <FormControl>
                  <Input placeholder="shadcn" {...field} />
                </FormControl>
                <FormDescription>你的姓名</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="password"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>密码</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormDescription>你的密码</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="confirmPassword"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>确认密码</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="" {...field} />
                </FormControl>
                <FormDescription>确认你的密码</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit"> Submit</Button>
        </form>
      </Form>
    </div>
  )
}
