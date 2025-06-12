import { defineConfig } from 'tsup';
import path from 'node:path';
import fs from 'node:fs/promises';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    pdfium: 'src/pdfium-engine.ts',
    worker: 'src/webworker-engine.ts',
    converters: 'src/converters/index.ts',
  },

  // one `.d.ts` per entry above
  dts: {
    entry: {
      index: 'src/index.ts',
      pdfium: 'src/pdfium-engine.ts',
      worker: 'src/webworker-engine.ts',
      converters: 'src/converters/index.ts',
    },
  },

  format: ['esm', 'cjs'],
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  tsconfig: path.resolve(__dirname, 'tsconfig.json'),
});
