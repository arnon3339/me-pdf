import { PdfiumEngineRunner } from '@embedpdf/engines';

async function init() {
  const response = await fetch('/pdfium.wasm');
  const wasmBinary = await response.arrayBuffer();
  const runner = new PdfiumEngineRunner(wasmBinary);
  runner.prepare();
}

init();
