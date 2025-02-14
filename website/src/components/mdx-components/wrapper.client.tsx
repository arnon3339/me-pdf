'use client'

import cn from 'clsx'
import type { MDXWrapper } from 'nextra'
import { useEffect } from 'react'
import { setToc, useConfig } from '../stores';

export const ClientWrapper: MDXWrapper = ({
  toc,
  children,
  metadata,
  bottomContent
}) => {
  const {
    activeType,
    activeThemeContext: themeContext,
    activePath
  } = useConfig().normalizePagesResult

  const date = themeContext.timestamp && metadata.timestamp

  // We can't update store in server component so doing it in client component
  useEffect(() => {
    setToc(toc)
  }, [toc])

  return (
    <>
      <article className={cn(
        'w-full min-w-0 break-words',
        'max-w-full',
        'mx-auto',
        'px-4 sm:px-6 lg:px-8',
        'w-full',
        'max-w-full',
        'mx-auto',
        'px-4 sm:px-6 lg:px-8'
      )}>
        {children}
      </article>
    </>
  )
}