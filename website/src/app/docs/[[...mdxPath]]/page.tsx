import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getDocsMDXComponents } from '../../../../mdx-components'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props: PageProps) {
  const params = await props.params
  
  const mdxPathArray = Array.isArray(params.mdxPath) ? ['docs', ...params.mdxPath] : ['docs'];

  const { metadata } = await importPage(mdxPathArray)
  return metadata
}

type PageProps = Readonly<{
  params: Promise<{
    mdxPath: string[]
    lang: string
  }>
}>
const Wrapper = getDocsMDXComponents().wrapper

export default async function Page(props: PageProps) {
  const params = await props.params

  const mdxPathArray = Array.isArray(params.mdxPath) ? ['docs', ...params.mdxPath] : ['docs'];

  const result = await importPage(mdxPathArray)
  const { default: MDXContent, toc, metadata } = result

  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent {...props} params={mdxPathArray} />
    </Wrapper>
  )
}