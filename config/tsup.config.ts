import path from 'node:path';
import { type Options, defineConfig } from 'tsup';

const PACKAGE_ROOT_PATH = process.cwd();
const INPUT_FILE = path.join(PACKAGE_ROOT_PATH, 'src/index.ts');

export default defineConfig((opts) => {
  const common: Options = {
    ...opts,
    entry: [INPUT_FILE],
    clean: true,
    dts: true,
    format: ['cjs', 'esm'],
    sourcemap: true,
    splitting: false,
  };

  return [
    {
      ...common,
    },
  ];
}); 