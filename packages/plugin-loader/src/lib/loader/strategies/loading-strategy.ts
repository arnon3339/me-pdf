import { PdfDocumentObject, PdfEngine, PdfFile, PdfFileUrl, PdfUrlOptions } from '@embedpdf/models';

export interface PDFUrlLoadingOptions {
  type: 'url';
  pdfFile: PdfFileUrl;
  options?: PdfUrlOptions;
  engine: PdfEngine;
}

export interface PDFBufferLoadingOptions {
  type: 'buffer';
  pdfFile: PdfFile;
  options?: {
    password?: string;
  };
  engine: PdfEngine;
}

export type PDFLoadingOptions = PDFUrlLoadingOptions | PDFBufferLoadingOptions;

export interface PDFLoadingStrategy {
  load(options?: PDFLoadingOptions): Promise<PdfDocumentObject>;
}
