import type { NextConfig } from 'next'
import nextra from 'nextra'
 
const withNextra = nextra({
  // ... Other Nextra config options,
})

const nextConfig: NextConfig = {
  /* config options here */
}
 
export default withNextra(nextConfig)