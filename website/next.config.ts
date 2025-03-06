import type { NextConfig } from 'next'
import nextra from 'nextra'
import type { Pluggable } from 'unified'
import { remarkNpm2Yarn } from '@theguild/remark-npm2yarn'
import { globSync } from 'glob';

const withNextra = nextra({
  // ... Other Nextra config options,
  mdxOptions: {
    remarkPlugins: [
      [
        remarkNpm2Yarn, // should be before remarkRemoveImports because contains `import { Tabs as $Tabs, Tab as $Tab } from ...`
        {
          packageName: '@/components/tabs123',
          tabNamesProp: 'items',
          storageKey: 'selectedPackageManager'
        }
      ] satisfies Pluggable
    ]
  }
})

const nextConfig = async (phase: string) => {
  const nextConfig: NextConfig = {}

  if (phase === 'phase-development-server') {
    const fs = await import('node:fs');
    
    const allFiles = globSync('../packages/*/package.json');

    const packageNames = allFiles
      .map((file: any) => {
        try {
          const packageJson = JSON.parse(fs.readFileSync(file, 'utf8'));
          return packageJson.name;
        } catch (error) {
          return null;
        }
      })
      .filter((pkg: string) => pkg?.startsWith('@embedpdf'));

    nextConfig.transpilePackages = packageNames;
  }

  return nextConfig;
}
 
export default withNextra(nextConfig)