import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/package').Config} */
const config = {
  preprocess: vitePreprocess(),
  package: {
    source: 'src/svelte',
    dir: 'dist/svelte',
    emitTypes: true,
    // No files filter needed - source already points to the right directory
  },
};

export default config;