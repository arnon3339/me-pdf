import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import { deleteSync } from 'del';
import { bundleWorker } from './tools/build-worker.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Clean dist folder
deleteSync(['dist/**']);

// Cache for the worker code - build once, use everywhere
let workerCodeCache = null;
let workerBuildPromise = null;

// Custom plugin to replace __WEBWORKER_BODY__ with bundled worker code
const workerReplacer = () => {
  return {
    name: 'worker-replacer',
    async buildStart() {
      // Only build the worker once, even across multiple plugin instances
      if (!workerBuildPromise) {
        console.log('Building worker...');
        workerBuildPromise = bundleWorker().then((code) => {
          workerCodeCache = code;
          console.log('Worker built successfully');
          return code;
        });
      }

      // Wait for the worker to be built if it's still in progress
      await workerBuildPromise;
    },
    transform(code, id) {
      // Only process files that contain the placeholder
      if (code.includes('__WEBWORKER_BODY__')) {
        console.log(`Replacing __WEBWORKER_BODY__ in ${id}`);
        // Escape the worker code for safe injection as a string literal
        const escapedWorkerCode = JSON.stringify(workerCodeCache);
        return code.replace('__WEBWORKER_BODY__', escapedWorkerCode);
      }
      return null;
    },
  };
};

/**
 * Injects the current package.json version into the bundle.
 * Replace every occurrence of __PDFIUM_VERSION__ with the literal version string.
 *
 *   const url = `https://…/@embedpdf/pdfium@__PDFIUM_VERSION__/dist/pdfium.wasm`;
 *   // ⇢ after build: “…@1.0.7/…”
 */
export function versionReplacer() {
  const rootDir = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8'));
  const { version } = pkg;

  const placeholder = /__PDFIUM_VERSION__/g;

  return {
    name: 'version-replacer',
    transform(code) {
      if (!placeholder.test(code)) return null;
      return {
        code: code.replace(placeholder, version),
        map: null,
      };
    },
  };
}

const entries = {
  index: 'src/lib/index.ts',
  pdfium: 'src/lib/pdfium/index.ts',
  'pdfium-direct-engine': 'src/lib/pdfium/web/direct-engine.ts',
  'pdfium-worker-engine': 'src/lib/pdfium/web/worker-engine.ts',
  worker: 'src/lib/webworker/engine.ts',
  converters: 'src/lib/converters/index.ts',
  react: 'src/react/index.ts',
  preact: 'src/preact/index.ts',
  vue: 'src/vue/index.ts',
};

const createConfig = (format) =>
  Object.entries(entries).map(([name, input]) => ({
    input,
    output: {
      file: `dist/${name}.${format === 'esm' ? 'js' : 'cjs'}`,
      format,
      sourcemap: true,
    },
    plugins: [
      workerReplacer(),
      versionReplacer(),
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        outDir: 'dist',
      }),
    ],
    external: (id) => {
      // Don't externalize relative imports or absolute paths
      if (id.startsWith('.') || id.startsWith('/')) return false;
      // Don't externalize the entry files themselves
      if (Object.values(entries).includes(id)) return false;
      // Externalize everything else (npm packages)
      return true;
    },
  }));

const createDtsConfig = () =>
  Object.entries(entries).map(([name, input]) => ({
    input,
    output: { file: `dist/${name}.d.ts`, format: 'es' },
    plugins: [dts()],
  }));

export default [...createDtsConfig(), ...createConfig('esm'), ...createConfig('cjs')];
