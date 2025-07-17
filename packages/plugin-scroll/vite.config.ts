import { defineConfig, PluginOption } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'unplugin-dts/vite';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('src');
const adapters = ['react', 'preact', 'vue', 'svelte']
  .filter((fw) => fs.existsSync(path.join(SRC, fw, 'index.ts')))
  .reduce((o, fw) => ({ ...o, [`${fw}/index`]: path.join(SRC, fw, 'index.ts') }), {});

// Optional: If Svelte adapter exists, import and add @vitejs/plugin-svelte
// import svelte from '@vitejs/plugin-svelte';

const plugins: PluginOption[] = [vue(), dts()];

export default defineConfig({
  plugins,
  build: {
    lib: {
      entry: {
        index: path.join(SRC, 'index.ts'),
        ...adapters,
      },
      formats: ['es', 'cjs'],
      fileName: (format: string, entryName: string) =>
        `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        dir: 'dist',
      },
      external: [
        'vue',
        'react',
        'react/jsx-runtime',
        'preact',
        'preact/jsx-runtime',
        'preact/hooks',
        /^@embedpdf\//,
      ],
    },
  },
});
