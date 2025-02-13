'use client'

import cn from 'clsx'
import { usePathname } from 'next/navigation'
import type { Heading } from 'nextra'
import { useFSRoute, useHash } from 'nextra/hooks'
import type { Item, MenuItem, PageItem } from 'nextra/normalize-pages'
import type { FC, FocusEventHandler, MouseEventHandler } from 'react'
import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import { useConfig } from './stores'

export const Sidebar: FC<{ toc: Heading[] }> = ({ toc }) => {
  const { normalizePagesResult, hideSidebar } = useConfig()
  const [showToggleAnimation, setToggleAnimation] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const sidebarControlsId = useId()

  return (<aside>
    test
  </aside>)
}