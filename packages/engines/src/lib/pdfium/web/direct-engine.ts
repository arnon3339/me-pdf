import { PdfiumEngine } from '../engine';
import { init } from '@embedpdf/pdfium';
import { Logger } from '@embedpdf/models';

export async function createPdfiumEngine(wasmUrl: string, logger?: Logger): Promise<PdfiumEngine> {
  const response = await fetch(wasmUrl);
  const wasmBinary = await response.arrayBuffer();
  const wasmModule = await init({ wasmBinary });
  return new PdfiumEngine(wasmModule, logger);
}
