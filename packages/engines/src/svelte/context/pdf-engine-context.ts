import { setContext } from 'svelte';
import type { PdfEngine } from '@embedpdf/models';

export interface PdfEngineContextState {
  engine: PdfEngine | null;
  isLoading: boolean;
  error: Error | null;
}

export const pdfEngineKey = Symbol('pdfEngineKey');

export function setEngineContext(ctx: PdfEngineContextState) {
  setContext(pdfEngineKey, ctx);
}
