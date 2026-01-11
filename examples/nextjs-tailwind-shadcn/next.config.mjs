/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@embedpdf/core', '@embedpdf/plugin-ui'],
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        config.resolve.alias.encoding = false;
        return config;
    },
    output: 'standalone',
};

export default nextConfig;
