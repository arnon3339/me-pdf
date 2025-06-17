import { PdfiumEngineRunner } from '@embedpdf/engines';

async function init() {
  const response = await fetch(
    'https://cdn.jsdelivr.net/npm/@embedpdf/pdfium@1.0.0/dist/pdfium.wasm',
  );
  const wasmBinary = await response.arrayBuffer();
  const runner = new PdfiumEngineRunner(wasmBinary);
  runner.prepare();
}

init();
