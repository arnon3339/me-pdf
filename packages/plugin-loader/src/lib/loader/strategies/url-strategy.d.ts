import { PdfDocumentObject } from '@embedpdf/models';
import { PDFUrlLoadingOptions, PDFLoadingStrategy } from './loading-strategy';
export declare class UrlStrategy implements PDFLoadingStrategy {
    load(loadingOptions: PDFUrlLoadingOptions): Promise<PdfDocumentObject>;
}
