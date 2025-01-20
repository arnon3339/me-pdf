import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@cloudpdf/core': path.resolve(__dirname, '../../packages/core/src'),
      '@cloudpdf/plugin-navigation': path.resolve(__dirname, '../../packages/plugin-navigation/src'),
      '@cloudpdf/plugin-renderer': path.resolve(__dirname, '../../packages/plugin-renderer/src'),
      '@cloudpdf/pdfium': path.resolve(__dirname, '../../packages/pdfium/src'),
      '@cloudpdf/models': path.resolve(__dirname, '../../packages/models/src')
    }
  },
  server: {
    port: 3000,
    open: true
  }
});