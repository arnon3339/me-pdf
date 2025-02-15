import type { NextConfig } from 'next'
import nextra from 'nextra'
import type { Pluggable } from 'unified'
import { remarkNpm2Yarn } from '@theguild/remark-npm2yarn'

const withNextra = nextra({
  // ... Other Nextra config options,
  mdxOptions: {
    remarkPlugins: [
      [
        remarkNpm2Yarn, // should be before remarkRemoveImports because contains `import { Tabs as $Tabs, Tab as $Tab } from ...`
        {
          packageName: '@/components/tabs',
          tabNamesProp: 'items',
          storageKey: 'selectedPackageManager'
        }
      ] satisfies Pluggable
    ]
  }
})

const nextConfig: NextConfig = {
  transpilePackages: [
    '@embedpdf/pdfium',
    '@embedpdf/engines',
    '@embedpdf/core',
    '@embedpdf/plugin-navigation'
  ]
}
 
export default withNextra(nextConfig)