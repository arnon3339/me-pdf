import type { PdfEngine } from '@embedpdf/models';
export interface PdfEngineContextState {
    engine: PdfEngine | null;
    isLoading: boolean;
    error: Error | null;
}
export declare const pdfEngineKey: unique symbol;
export declare function setEngineContext(ctx: PdfEngineContextState): void;
