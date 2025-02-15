import { PdfDocumentObject, PdfEngine } from '@embedpdf/models';
import { IPlugin, IPluginManager } from "./plugin";
import { PDFLoadingOptions } from '../core/loader/strategies/PDFLoadingStrategy';

export interface PDFCoreOptions {
  engine: PdfEngine;
  defaultPlugins?: IPlugin[];
}

export type PDFCoreLoadDocumentOptions = Omit<PDFLoadingOptions, 'engine'>;

export interface IPDFCore extends IPluginManager {
  engine: PdfEngine;
  loadDocument(options: PDFCoreLoadDocumentOptions): Promise<PdfDocumentObject>;
  getDocument(): PdfDocumentObject | null;
}