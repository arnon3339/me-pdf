import dotenv from 'dotenv';
dotenv.config();

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import url from '@rollup/plugin-url';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import alias from '@rollup/plugin-alias';

// Check if we are in 'development' mode
const isDev = process.env.ROLLUP_WATCH;

export default {
  input: 'src/embedpdf.ts',  // Update to TypeScript entry file
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: false
  },
  plugins: [
    copy({
      targets: [
        { 
          src: 'src/index.html', 
          dest: 'dist'
        },
        /*
        {
          src: 'node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js',
          dest: 'dist'
        },
        {
          src: 'node_modules/@ricky0123/vad-web/dist/silero_vad.onnx',
          dest: 'dist'
        },
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: 'dist'
        }*/
      ]
    }),
    url({
      include: ['**/*.svg'], // ensures files ending with .svg are included
      limit: 8192 // files smaller than this gets inlined as base64 data URIs
    }),
    resolve({
      browser: true, 
      dedupe: [
        'react', 
        'react-dom', 
        'react/jsx-runtime', 
        'preact/compat', 
        'preact/compat/jsx-runtime'
      ]
    }),
    commonjs(),
    alias({
      entries: [
        { find: 'react', replacement: 'preact/compat' },
        { find: 'react-dom/test-utils', replacement: 'preact/test-utils' },
        { find: 'react-dom', replacement: 'preact/compat' },
        { find: 'react/jsx-runtime', replacement: 'preact/jsx-runtime' }
      ]
    }),
    postcss({
      extract: false,
      modules: false,
      autoModules: false,
      minimize: true,
      inject: false,
      plugins: [autoprefixer(), tailwindcss()]
    }),
    typescript(),
    babel({
      exclude: 'node_modules/**',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],  // Adding .ts and .tsx
      babelHelpers: 'bundled',
      babelrc: true
    }),
    isDev && serve({
      open: true,
      verbose: true,
      contentBase: ['dist'],
      historyApiFallback: true,
      host: 'localhost',
      port: 3020,
    }),
    terser({
      module: true,
      compress: isDev ? false : true
    }),
    isDev && livereload({
      watch: 'dist',
      verbose: false, // Disable console output
    })
  ].filter(Boolean),
};