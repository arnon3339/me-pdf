import { PdfDocumentObject, PdfEngine, PdfFileWithoutContent } from '@embedpdf/models';

export interface PDFLoadingOptions {
  file: PdfFileWithoutContent;
  source: any;
  password: string;
  engine: PdfEngine;
}

export interface PDFLoadingStrategy {
  load(options?: PDFLoadingOptions): Promise<PdfDocumentObject>;
} 