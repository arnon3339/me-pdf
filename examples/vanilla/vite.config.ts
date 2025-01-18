import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@your-pdf-lib/core': path.resolve(__dirname, '../../packages/core/src'),
      '@your-pdf-lib/plugin-navigation': path.resolve(__dirname, '../../packages/plugin-navigation/src')
    }
  },
  server: {
    port: 3000,
    open: true
  }
});