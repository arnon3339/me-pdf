import { PDFUrlLoadingOptions, PDFBufferLoadingOptions, PDFLoadingStrategy, PDFLoadingOptions } from './strategies/loading-strategy';
import { PdfDocumentObject } from '@embedpdf/models';
export type StrategyResolver = (options: PDFLoadingOptions) => PDFLoadingStrategy | undefined;
export declare class PDFDocumentLoader {
    private strategies;
    private strategyResolvers;
    constructor();
    registerStrategy(name: string, strategy: PDFLoadingStrategy): void;
    getStrategy(name: string): PDFLoadingStrategy | undefined;
    addStrategyResolver(resolver: StrategyResolver): void;
    loadDocument(options: PDFLoadingOptions): Promise<PdfDocumentObject>;
    private resolveStrategy;
}
export declare function isPdfUrlLoadingOptions(options: PDFLoadingOptions): options is PDFUrlLoadingOptions;
export declare function isPdfBufferLoadingOptions(options: PDFLoadingOptions): options is PDFBufferLoadingOptions;
