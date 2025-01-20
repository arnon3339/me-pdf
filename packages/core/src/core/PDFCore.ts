import { PdfDocumentObject, PdfEngine } from '@cloudpdf/models';
import { IPDFCore, PDFCoreOptions } from '../types/core';
import { PDFLoadingOptions, PDFDocumentLoader } from './loader';
import { PDFPluginManager } from './PDFPluginManager';

export class PDFCore extends PDFPluginManager implements IPDFCore {
  private engine: PdfEngine;
  private documentLoader: PDFDocumentLoader;

  constructor(options: PDFCoreOptions) {
    super();
    this.engine = options.engine;
    this.engine.initialize?.()
    this.documentLoader = new PDFDocumentLoader();
  }

  async loadDocument(options: Omit<PDFLoadingOptions, 'engine'>): Promise<PdfDocumentObject> {
    return this.documentLoader.loadDocument({
      ...options,
      engine: this.engine,
    });
  }

  protected getPluginHost(): IPDFCore {
    return this;
  }
}