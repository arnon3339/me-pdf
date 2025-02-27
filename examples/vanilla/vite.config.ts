import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@embedpdf/core': path.resolve(__dirname, '../../packages/core/src'),
      '@embedpdf/plugin-loader': path.resolve(__dirname, '../../packages/plugin-loader/src'),
      '@embedpdf/plugin-scroll': path.resolve(__dirname, '../../packages/plugin-scroll/src'),
      '@embedpdf/plugin-spread': path.resolve(__dirname, '../../packages/plugin-spread/src'),
      '@embedpdf/plugin-navigation': path.resolve(__dirname, '../../packages/plugin-navigation/src'),
      '@embedpdf/plugin-renderer': path.resolve(__dirname, '../../packages/plugin-renderer/src'),
      '@embedpdf/plugin-layer': path.resolve(__dirname, '../../packages/plugin-layer/src'),
      '@embedpdf/plugin-zoom': path.resolve(__dirname, '../../packages/plugin-zoom/src'),
      '@embedpdf/plugin-viewport': path.resolve(__dirname, '../../packages/plugin-viewport/src'),
      '@embedpdf/plugin-page-manager': path.resolve(__dirname, '../../packages/plugin-page-manager/src'),
      '@embedpdf/pdfium': path.resolve(__dirname, '../../packages/pdfium/src'),
      '@embedpdf/models': path.resolve(__dirname, '../../packages/models/src'),
      '@embedpdf/engines': path.resolve(__dirname, '../../packages/engines/src'),
      '@embedpdf/layer-text': path.resolve(__dirname, '../../packages/layer-text/src'),
      '@embedpdf/layer-render': path.resolve(__dirname, '../../packages/layer-render/src')
    }
  },
  server: {
    port: 3000,
    open: true
  }
});