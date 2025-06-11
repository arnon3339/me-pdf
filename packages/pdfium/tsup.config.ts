// packages/pdfium/tsup.config.ts
import {
  copyFileSync,
  mkdirSync,
  renameSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'tsup';

/* ------------------------------------------------------------------ */
/* constants & helpers                                                */
/* ------------------------------------------------------------------ */
const WASM = 'pdfium.wasm';
const DIST = resolve(__dirname, 'dist');

async function copyWasm() {
  mkdirSync(DIST, { recursive: true });
  copyFileSync(resolve(__dirname, 'src', WASM), resolve(DIST, WASM));
}

/* ------------------------------------------------------------------ */
/* post-build work to do exactly once                                 */
/* ------------------------------------------------------------------ */
let done = false;
process.on('beforeExit', () => {
  if (done) return;
  done = true;

  /* 1. rename declaration files */
  const dtsMap: [string, string][] = [
    ['index.esm.d.ts', 'index.d.ts'],
    ['index.cjs.d.cts', 'index.d.cts'],
  ];
  for (const [from, to] of dtsMap) {
    const src = resolve(DIST, from);
    if (existsSync(src)) renameSync(src, resolve(DIST, to));
  }

  /* 2. patch wasm filename inside the JS bundles */
  ['index.js', 'index.cjs'].forEach((file) => {
    const p = resolve(DIST, file);
    if (!existsSync(p)) return;
    const txt = readFileSync(p, 'utf8').replace(/pdfium\.esm\.wasm/g, 'pdfium.wasm');
    writeFileSync(p, txt);
  });
});

/* ------------------------------------------------------------------ */
/* tsup configuration                                                 */
/* ------------------------------------------------------------------ */
export default defineConfig([
  /* ----------  ESM ---------- */
  {
    entry: { index: 'src/index.esm.ts' },
    format: ['esm'],
    outDir: 'dist',
    dts: { entry: 'src/index.esm.ts' },
    splitting: false,
    clean: true,
    sourcemap: true,
    external: [`./${WASM}`],
    esbuildOptions(o) {
      o.loader = { ...o.loader, '.wasm': 'file' };
    },
    onSuccess: copyWasm,
  },

  /* ----------  CJS ---------- */
  {
    entry: { index: 'src/index.cjs.ts' },
    format: ['cjs'],
    outDir: 'dist',
    dts: { entry: 'src/index.cjs.ts' },
    splitting: false,
    clean: false,
    sourcemap: true,
    external: [`./${WASM}`],
    esbuildOptions(o) {
      o.loader = { ...o.loader, '.wasm': 'file' };
    },
    outExtension: () => ({ js: '.cjs' }),
  },
]);
