import type { MdxFile } from 'nextra'
import { Link } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import type { FC } from 'react'

export const Blog: FC = async () => {
  const pageMap = (await getPageMap(`/blog`)) as unknown as MdxFile[]
  return pageMap.map(page => {
    if (page.name === 'index') return
    const { title, description, timestamp } = page.frontMatter!

    return (
      <div key={page.route} className="mt-12">
        <h3 className="text-2xl font-semibold">{title}</h3>
        <p className="my-6 leading-7 opacity-80">
          {description}{' '}
          <Link href={page.route} className="after:content-['_→']">
            Read more
          </Link>
        </p>
        {
        <time
          dateTime={new Date(timestamp).toISOString()}
          className="text-sm opacity-50"
        >
          {new Date(timestamp).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </time>}
      </div>
    )
  })
}