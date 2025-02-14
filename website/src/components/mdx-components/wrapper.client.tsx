'use client'

import cn from 'clsx'
import type { MDXWrapper } from 'nextra'
import { useEffect } from 'react'
import { setToc, useConfig } from '../stores';
import { Pagination } from '../pagination';
import { Breadcrumb } from '../breadcrumb';

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
        'text-slate-700 dark:text-slate-200 pb-8 px-4 pt-4 md:px-12',
      )}>
        {themeContext.breadcrumb && activeType !== 'page' && (
          <Breadcrumb activePath={activePath} />
        )}
        {children}
        {date ? (
          <div className="mt-12 mb-8 text-xs text-gray-500 text-end dark:text-gray-400">
            Last updated on {new Date(date).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        ) : (
          <div className="x:mt-16" />
        )}
        {themeContext.pagination && activeType !== 'page' && <Pagination />}
      </article>
    </>
  )
}