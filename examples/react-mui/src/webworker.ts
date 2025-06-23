import { PdfiumEngineRunner } from '@embedpdf/engines';

async function init() {
  const response = await fetch('https://cdn.jsdelivr.net/npm/@embedpdf/pdfium/dist/pdfium.wasm');
  const wasmBinary = await response.arrayBuffer();
  const runner = new PdfiumEngineRunner(wasmBinary);
  await runner.prepare();
}

init();
