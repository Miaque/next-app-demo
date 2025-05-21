import { LinkProps } from 'next/link'
import React from 'react'
import { User } from '@/types/user'

export interface SidebarData {
  user: User
  teams: Team[]
  navGroups: NavGroup[]
}

export interface Team {
  name: string
  logo: React.ElementType
  plan: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export type NavItem = NavCollapsible | NavLink

export type NavLink = BaseNavItem & {
  url: LinkProps['href']
  items?: never
}

export type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps['href'] })[]
  url?: never
}

export interface BaseNavItem {
  title: string
  badge?: string
  icon?: React.ElementType
}
