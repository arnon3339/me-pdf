import { PdfDocumentObject } from '@embedpdf/models';
import { PDFBufferLoadingOptions, PDFLoadingStrategy } from './loading-strategy';
export declare class BufferStrategy implements PDFLoadingStrategy {
    load(loadingOptions: PDFBufferLoadingOptions): Promise<PdfDocumentObject>;
}
