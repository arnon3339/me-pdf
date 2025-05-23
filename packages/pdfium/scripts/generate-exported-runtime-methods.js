import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { methods, types } from './exported-runtime-methods.js';

// Get current directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const names = methods.join(',');
fs.writeFileSync(path.join(__dirname, '../build/exported-runtime-methods.txt'), names, {
  encoding: 'utf-8',
});

const defintion = `
/// <reference types="emscripten" />

export interface WasmExports {
  malloc: (size: number) => number;
  free: (ptr: number) => void;
}

export interface PdfiumRuntimeMethods {
${methods
  .map((func) => {
    if (types[func]) {
      return `  ${func}: ${types[func]};`;
    }
    return `  ${func}: typeof ${func};`;
  })
  .join('\n')}
}
`;

fs.writeFileSync(path.join(__dirname, '../src/runtime.ts'), defintion, {
  encoding: 'utf-8',
});
