import path from 'node:path';
import fs from 'node:fs';
import { type Options, defineConfig } from 'tsup';

const PACKAGE_ROOT_PATH = process.cwd();
const SRC_PATH = path.join(PACKAGE_ROOT_PATH, 'src');

function getEntries() {
  const entries: Record<string, string> = {};
  
  // Add main entry
  if (fs.existsSync(path.join(SRC_PATH, 'index.ts'))) {
    entries['index'] = path.join(SRC_PATH, 'index.ts');
  }

  // Add framework entries
  const frameworks = ['react', 'vue', 'svelte'];
  frameworks.forEach(framework => {
    const frameworkEntry = path.join(SRC_PATH, framework, 'index.ts');
    if (fs.existsSync(frameworkEntry)) {
      entries[`${framework}/index`] = frameworkEntry;
    }
  });

  return entries;
}

export default defineConfig((opts) => {
  const common: Options = {
    ...opts,
    entry: getEntries(),
    clean: true,
    dts: true,
    format: ['cjs', 'esm'],
    sourcemap: true,
    splitting: false,
    outDir: 'dist',
    tsconfig: path.join(PACKAGE_ROOT_PATH, 'tsconfig.json'),
    async onSuccess() {
      // Copy WASM files if they exist
      const wasmFile = path.join(SRC_PATH, 'pdfium.wasm');
      if (fs.existsSync(wasmFile)) {
        await fs.promises.copyFile(wasmFile, path.join(PACKAGE_ROOT_PATH, 'dist', 'pdfium.wasm'));
      }
    }
  };

  return [
    {
      ...common,
    },
  ];
}); 