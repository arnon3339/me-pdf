import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';

export async function bundleWorker() {
  const bundle = await rollup({
    input: 'src/components/webworker.ts',
    plugins: [
      resolve(),
      typescript(),
      terser({
        compress: true,
      }),
      replace({
        preventAssignment: true,
        delimiters: ['', ''],
        'new URL("pdfium.wasm",import.meta.url).href': '"pdfium.wasm"',
      }),
    ],
  });
  const { output } = await bundle.generate({
    format: 'es',
    inlineDynamicImports: true,
  });
  return output[0].code;
}
