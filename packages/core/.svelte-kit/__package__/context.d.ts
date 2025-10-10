import type { PluginRegistry } from '@embedpdf/core';
export interface PDFContextState {
    registry: PluginRegistry | null;
    isInitializing: boolean;
    pluginsReady: boolean;
}
export declare const pdfKey: unique symbol;
export declare function setPDFContext(ctx: PDFContextState): void;
export declare function getPDFContext(): PDFContextState;
