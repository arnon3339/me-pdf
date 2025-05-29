import { PdfiumEngine } from '@embedpdf/engines/pdfium';
import { init } from '@embedpdf/pdfium';

export async function createLocalEngine(): Promise<PdfiumEngine> {
  const response = await fetch('/pdfium.wasm');
  const wasmBinary = await response.arrayBuffer();
  const wasmModule = await init({ wasmBinary });
  return new PdfiumEngine(wasmModule);
}
