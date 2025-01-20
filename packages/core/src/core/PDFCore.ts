import { PdfDocumentObject, PdfEngine } from '@cloudpdf/models';
import { IPDFCore, PDFCoreOptions } from '../types/core';
import { PDFLoadingOptions, PDFDocumentLoader } from './loader';
import { PDFPluginManager } from './PDFPluginManager';

export class PDFCore extends PDFPluginManager implements IPDFCore {
  public engine: PdfEngine;
  private documentLoader: PDFDocumentLoader;

  constructor(options: PDFCoreOptions) {
    super();
    this.engine = options.engine;
    this.engine.initialize?.()
    this.documentLoader = new PDFDocumentLoader();
  }

  async loadDocument(options: Omit<PDFLoadingOptions, 'engine'>): Promise<PdfDocumentObject> {
    const document = await this.documentLoader.loadDocument({
      ...options,
      engine: this.engine,
    });

    this.emit('document:loaded', document);
    return document;
  }

  protected getPluginHost(): IPDFCore {
    return this;
  }
}