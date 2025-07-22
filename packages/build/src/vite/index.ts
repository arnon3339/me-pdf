import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type UserConfig, Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'unplugin-dts/vite';

const sharedExternal = [/^@embedpdf\/(?!.*\/@framework$)/];

// ⚠️ rename shared directory for framework builds to avoid conflicts
const beforeWriteFile = (outputPrefix: string) => (filePath: string, content: string) => {
  if (!outputPrefix) return;           // base build → leave untouched
  
  // If this file IS in the shared directory, rename the directory
  if (filePath.includes(`${path.sep}dist${path.sep}shared${path.sep}`)) {
    const modifiedPath = filePath.replace(
      `${path.sep}shared${path.sep}`,
      `${path.sep}shared-${outputPrefix}${path.sep}`
    );

    return { filePath: modifiedPath, content };
  }
  
  // If this file is NOT in shared directory, update its imports to shared
  const modifiedContent = content.replace(
    /\.\.\/shared/g,
    `../shared-${outputPrefix}`
  );

  return { filePath, content: modifiedContent };
}

/* ───── helpers ───────────────────────────────────────────────────── */
export function aliasFromTsconfig(tsconfigFile: string) {
  const raw = JSON.parse(fs.readFileSync(tsconfigFile, 'utf8'));
  const { paths = {}, baseUrl = '.' } = raw.compilerOptions ?? {};
  const baseDir = path.dirname(tsconfigFile);

  return Object.fromEntries(
    Object.entries(paths as Record<string, string[]>).map(([key, [p0]]) => {
      const isRelative = p0.startsWith('.') || p0.startsWith('/');
      return [key, isRelative ? path.resolve(baseDir, baseUrl, p0) : p0];
    }),
  );
}

const exists = (rel: string) =>
  fs.existsSync(path.resolve(process.cwd(), 'src', rel));

/* ───── preset core ───────────────────────────────────────────────── */
export interface ConfigOptions {
  tsconfigPath: string;
  entryPath: string;
  outputPrefix?: string;
  external?: string[];
  additionalPlugins?: any[];
  esbuildOptions?: UserConfig['esbuild'];   // ⚠️ allow caller to pass esbuild opts
  dtsExclude?: string[];                    // ⚠️ exclude patterns for dts plugin
}

export function createConfig(opts: ConfigOptions): UserConfig {
  const {
    tsconfigPath,
    entryPath,
    outputPrefix = '',
    external = [],
    additionalPlugins = [],
    esbuildOptions = {},                    // ⚠️
    dtsExclude = [],                        // ⚠️
  } = opts;

  const pkgRoot = process.cwd();
  const tsconfigAbs = path.resolve(
    pkgRoot,
    tsconfigPath.startsWith('.') ? tsconfigPath : path.join('src', tsconfigPath),
  );
  const entryAbs = path.resolve(pkgRoot, 'src', entryPath);
  const filePrefix = outputPrefix ? `${outputPrefix}/` : '';

  return {
    resolve: { alias: aliasFromTsconfig(tsconfigAbs) },
    esbuild: esbuildOptions,               // ⚠️  hand straight to vite:esbuild
    plugins: [
      ...additionalPlugins, 
      dts({ 
        tsconfigPath: tsconfigAbs,
        exclude: dtsExclude,                // ⚠️ use the passed exclude patterns
        beforeWriteFile: beforeWriteFile(outputPrefix)
      })
    ],
    build: {
      emptyOutDir: false,
      sourcemap: true,
      lib: {
        entry: entryAbs,
        formats: ['es', 'cjs'],
        fileName: (fmt) =>
          `${filePrefix}index.${fmt === 'es' ? 'js' : 'cjs'}`,
      },
      rollupOptions: {
        external: [...external, ...sharedExternal],
        output: { dir: path.resolve(pkgRoot, 'dist') },
      },
    },
  };
}

/* ───── one‑liner for leaf packages ──────────────────────────────── */
export function defineLibrary() {
  return defineConfig(({ mode }) => {
    switch (mode) {
      case 'react':
        if (!exists('react/index.ts')) throw new Error('No React adapter');
        return createConfig({
          tsconfigPath: 'react/tsconfig.react.json',
          entryPath: 'react/index.ts',
          outputPrefix: 'react',
          external: ['react', 'react/jsx-runtime', 'react-dom'],
          // React build needs no extra esbuild tweaks
        });

      case 'preact':
        if (!exists('preact/index.ts')) throw new Error('No Preact adapter');
        return createConfig({
          tsconfigPath: 'preact/tsconfig.preact.json',
          entryPath: 'preact/index.ts',
          outputPrefix: 'preact',
          external: [
            'preact',
            'preact/hooks',
            'preact/jsx-runtime',
            // keep these so a stray import can’t bundle React
            'react',
            'react/jsx-runtime',
          ],
          esbuildOptions: {                // ⚠️ tell esbuild the runtime
            jsx: 'automatic',
            jsxImportSource: 'preact',
          },
        });

      case 'vue':
        if (!exists('vue/index.ts')) throw new Error('No Vue adapter');
        return createConfig({
          tsconfigPath: 'vue/tsconfig.vue.json',
          entryPath: 'vue/index.ts',
          outputPrefix: 'vue',
          external: ['vue'],
          additionalPlugins: [vue()],
        });

      default: // base
        return createConfig({
          tsconfigPath: './tsconfig.json',
          entryPath: 'index.ts',
          dtsExclude: ['**/react/**', '**/preact/**', '**/vue/**', '**/shared/**'], // exclude framework dirs for base build
        });
    }
  });
}
