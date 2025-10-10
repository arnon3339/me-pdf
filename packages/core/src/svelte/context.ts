import type { PluginRegistry } from '@embedpdf/core';
import { getContext, setContext } from 'svelte';

export interface PDFContextState {
  registry: PluginRegistry | null;
  isInitializing: boolean;
  pluginsReady: boolean;
}

export const pdfKey = Symbol('pdfKey');

export function setPDFContext(ctx: PDFContextState) {
  setContext(pdfKey, ctx);
}

export function getPDFContext(): PDFContextState {
  const ctx = getContext<PDFContextState>(pdfKey);
  if (!ctx) throw new Error('getPDFContext must be used inside <EmbedPDF>');
  return ctx;
}
