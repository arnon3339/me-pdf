import { PdfDocumentObject, PdfEngine } from '@cloudpdf/models';
import { IPDFCore, PDFCoreOptions } from '../types/core';
import { PDFLoadingOptions, PDFDocumentLoader } from './loader';
import { PDFPluginManager } from './PDFPluginManager';

export class PDFCore extends PDFPluginManager implements IPDFCore {
  public engine: PdfEngine;
  private documentLoader: PDFDocumentLoader;
  private document: PdfDocumentObject | null = null;

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

    this.document = document;

    this.emit('document:loaded', document);
    return document;
  }

  getDocument(): PdfDocumentObject | null {
    return this.document;
  }

  protected getPluginHost(): IPDFCore {
    return this;
  }
}