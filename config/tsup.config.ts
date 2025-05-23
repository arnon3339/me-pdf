import path from 'node:path';
import fs from 'node:fs';
import { defineConfig } from 'tsup';

const PACKAGE_ROOT_PATH = process.cwd();
const SRC_PATH = path.join(PACKAGE_ROOT_PATH, 'src');

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true, // Generate declaration files
  format: ['cjs', 'esm'],
  sourcemap: true,
  clean: true, // Clean the dist folder before building
  outDir: 'dist',
  tsconfig: path.join(PACKAGE_ROOT_PATH, 'tsconfig.json'),
  async onSuccess() {
    // Copy WASM files if they exist
    const wasmFile = path.join(SRC_PATH, 'pdfium.wasm');
    if (fs.existsSync(wasmFile)) {
      await fs.promises.copyFile(wasmFile, path.join(PACKAGE_ROOT_PATH, 'dist', 'pdfium.wasm'));
    }
  },
});
