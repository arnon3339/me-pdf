import { PdfDocumentObject, PdfEngine, PdfFileWithoutContent } from '@embedpdf/models';

export interface PDFLoadingOptions {
  id: string;
  source: any;
  password?: string;
  engine: PdfEngine;
}

export interface PDFLoadingStrategy {
  load(options?: PDFLoadingOptions): Promise<PdfDocumentObject>;
} 