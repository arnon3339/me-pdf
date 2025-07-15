import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
    exclude: [
      '@embedpdf/core',
      '@embedpdf/plugin-loader',
      '@embedpdf/plugin-viewport',
      '@embedpdf/plugin-scroll',
      '@embedpdf/plugin-zoom',
      '@embedpdf/plugin-render',
      '@embedpdf/plugin-tiling',
      '@embedpdf/plugin-search',
      '@embedpdf/plugin-interaction-manager',
      '@embedpdf/plugin-pan',
      '@embedpdf/plugin-rotate',
      '@embedpdf/plugin-spread',
      '@embedpdf/plugin-fullscreen',
      '@embedpdf/plugin-export',
      '@embedpdf/plugin-thumbnail',
      '@embedpdf/plugin-selection',
      '@embedpdf/models',
      '@embedpdf/pdfium',
      '@embedpdf/engines',
    ],
  },
});
