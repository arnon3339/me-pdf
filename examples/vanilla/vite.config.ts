import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@embedpdf/core': path.resolve(__dirname, '../../packages/core/src'),
      '@embedpdf/plugin-navigation': path.resolve(__dirname, '../../packages/plugin-navigation/src'),
      '@embedpdf/plugin-renderer': path.resolve(__dirname, '../../packages/plugin-renderer/src'),
      '@embedpdf/plugin-layer': path.resolve(__dirname, '../../packages/plugin-layer/src'),
      '@embedpdf/pdfium': path.resolve(__dirname, '../../packages/pdfium/src'),
      '@embedpdf/models': path.resolve(__dirname, '../../packages/models/src')
    }
  },
  server: {
    port: 3000,
    open: true
  }
});