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
      <article>
        {children}
      </article>
    </>
  )
}