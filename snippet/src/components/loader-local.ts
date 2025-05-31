import { PdfiumEngine } from '@embedpdf/engines/pdfium';
import { init } from '@embedpdf/pdfium';

export async function createLocalEngine(wasmUrl: string): Promise<PdfiumEngine> {
  const response = await fetch(wasmUrl);
  const wasmBinary = await response.arrayBuffer();
  const wasmModule = await init({ wasmBinary });
  return new PdfiumEngine(wasmModule);
}
