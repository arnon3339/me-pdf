import cn from 'clsx'
import {
  withIcons
} from 'nextra/components'
import { useMDXComponents as getNextraMDXComponents } from 'nextra/mdx-components'
import type { MDXComponents } from 'nextra/mdx-components'
import { removeLinks } from 'nextra/remove-links'
import type { ComponentProps, FC } from 'react'
import { Link } from './link'
import { H1, H2, H3, H4, H5, H6 } from './heading'
import { ClientWrapper } from './wrapper.client'
import { Sidebar } from '../sidebar'
import { Table } from './table'
import { Code } from './code'
import { Callout } from '../callout'
import { Pre } from './pre'
import { PdfMergeTool } from '../tools/pdf-merge'
import ToolsOverview from '../tools-overview'

const Blockquote: FC<ComponentProps<'blockquote'>> = props => (
  <blockquote
    className={cn(
      'not-first:mt-6 border-gray-300 italic text-gray-700',
      'border-s-2 ps-6'
    )}
    {...props}
  />
)

const DEFAULT_COMPONENTS = getNextraMDXComponents({
  a: Link,
  code: Code,
  blockquote: Blockquote,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  hr: props => <hr className="my-8 nextra-border" {...props} />,
  li: props => <li className="my-2" {...props} />,
  ol: props => (
    <ol
      className="[is(ol,ul)_&]:my-3 not-first:mt-6 list-decimal ms-6"
      {...props}
    />
  ),
  p: props => <p className="not-first:mt-6 leading-7" {...props} />,
  pre: withIcons(Pre),
  table: ({ className, ...props }) => (
    <Table
      className={cn('nextra-scrollbar not-first:mt-6 p-0', className)}
      {...props}
    />
  ),
  td: Table.Td,
  th: Table.Th,
  tr: Table.Tr,
  ul: props => (
    <ul
      className="[is(ol,ul)_&]:my-3 not-first:mt-6 list-disc ms-6"
      {...props}
    />
  ),
  wrapper({ toc, children, metadata, bottomContent, ...props }) {
    // @ts-expect-error fixme
    toc = toc.map(item => ({
      ...item,
      value: removeLinks(item.value)
    }))
    return (
      <div
        className="flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        {...props}
      >
        <Sidebar toc={toc} floatTOC={true} />

        <ClientWrapper
          toc={toc}
          metadata={metadata}
          bottomContent={bottomContent}
        >
          <main
            data-pagefind-body={
              (metadata as any).searchable !== false || undefined
            }
          >
            {children}
          </main>
        </ClientWrapper>
      </div>
    )
  },
  PdfMergeTool,
  ToolsOverview,
})

export const useMDXComponents = (components?: Readonly<MDXComponents>) => {
  return {
    ...DEFAULT_COMPONENTS,
    ...components
  } satisfies MDXComponents
}