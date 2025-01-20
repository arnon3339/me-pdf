import { PDFLoadingOptions, PDFLoadingStrategy } from './strategies/PDFLoadingStrategy';
import { RangeRequestStrategy } from './strategies/RangeRequestStrategy';
import { BufferStrategy } from './strategies/BufferStrategy';
import { PdfDocumentObject } from '@cloudpdf/models';

export class PDFDocumentLoader {
  private strategies: Map<string, PDFLoadingStrategy> = new Map();

  constructor() {
    const bufferStrategy = new BufferStrategy();
    this.registerStrategy('range', new RangeRequestStrategy(bufferStrategy));
    this.registerStrategy('buffer', new BufferStrategy());
  }

  private registerStrategy(name: string, strategy: PDFLoadingStrategy) {
    this.strategies.set(name, strategy);
  }

  async loadDocument(options: PDFLoadingOptions): Promise<PdfDocumentObject> {
    try {
      if (typeof options.source === 'string') {
        const rangeStrategy = this.strategies.get('range');
        if (!rangeStrategy) throw new Error('Range strategy not found');
        return await rangeStrategy.load(options);
      } else {
        const bufferStrategy = this.strategies.get('buffer');
        if (!bufferStrategy) throw new Error('Buffer strategy not found');
        return await bufferStrategy.load(options);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      throw error;
    }
  }
} 