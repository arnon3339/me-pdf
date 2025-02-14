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
  /* config options here */
}
 
export default withNextra(nextConfig)