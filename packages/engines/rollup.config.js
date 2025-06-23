import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import { deleteSync } from 'del';
import { bundleWorker } from './tools/build-worker.js';

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

const entries = {
  index: 'src/lib/index.ts',
  pdfium: 'src/lib/pdfium/index.ts',
  'pdfium-direct-engine': 'src/lib/pdfium/web/direct-engine.ts',
  'pdfium-worker-engine': 'src/lib/pdfium/web/worker-engine.ts',
  worker: 'src/lib/webworker/engine.ts',
  converters: 'src/lib/converters/index.ts',
  react: 'src/react/index.ts',
  preact: 'src/preact/index.ts',
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
