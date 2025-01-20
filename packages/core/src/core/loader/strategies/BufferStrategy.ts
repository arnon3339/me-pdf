import { PdfDocumentObject } from '@cloudpdf/models';
import { PDFLoadingOptions, PDFLoadingStrategy } from './PDFLoadingStrategy';

export class BufferStrategy implements PDFLoadingStrategy {
  async load(options: PDFLoadingOptions): Promise<PdfDocumentObject> {
    const { file, source, password, engine } = options;

    const task = engine.openDocument({
      id: file.id,
      name: file.name,
      content: source,
    }, password);

    return new Promise<PdfDocumentObject>((resolve, reject) => {
      task.wait(
        // Success callback
        (result) => resolve(result),
        // Error callback
        (error) => {
          if (error.type === 'abort') {
            reject(new Error(`PDF loading aborted: ${error.reason}`));
          } else {
            reject(new Error(`PDF loading failed: ${error.reason}`));
          }
        }
      );
    });
  }
} 