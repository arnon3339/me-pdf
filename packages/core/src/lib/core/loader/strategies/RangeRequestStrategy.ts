import { PdfDocumentObject } from '@embedpdf/models';
import { PDFLoadingOptions, PDFLoadingStrategy } from './PDFLoadingStrategy';

export class RangeRequestStrategy implements PDFLoadingStrategy {
  private bufferStrategy: PDFLoadingStrategy;

  constructor(bufferStrategy: PDFLoadingStrategy) {
    this.bufferStrategy = bufferStrategy;
  }

  private async checkRangeSupport(url: string) {
    try {
      const headResponse = await fetch(url, { method: 'HEAD' });
      const fileLength = headResponse.headers.get('Content-Length');
      const acceptRanges = headResponse.headers.get('Accept-Ranges');
      
      if (acceptRanges === 'bytes') {
        return { supportsRanges: true, fileLength: parseInt(fileLength ?? '0'), content: null };
      }

      const testResponse = await fetch(url, {
        headers: { 'Range': 'bytes=0-1' }
      });
      
      // If we get 200, return the whole file content
      if (testResponse.status === 200) {
        const content = await testResponse.arrayBuffer();
        return { 
          supportsRanges: false, 
          fileLength: parseInt(fileLength ?? '0'),
          content: content
        };
      }
      
      return {
        supportsRanges: testResponse.status === 206,
        fileLength: parseInt(fileLength ?? '0'),
        content: null
      };
    } catch (error) {
      throw new Error('Failed to check range support: ' + error);
    }
  }

  async load(options: PDFLoadingOptions): Promise<PdfDocumentObject> {
    const { file, source, password, engine } = options;
    const { supportsRanges, fileLength, content } = await this.checkRangeSupport(source);
    

    if (!supportsRanges) {
      if(!content) throw new Error('Could not load file');

      return this.bufferStrategy.load({ 
        ...options,
        source: content
       });
    }

    const task = engine.openDocumentFromLoader({
      id: file.id,
      name: file.name,
      fileLength,
      callback: this.createRangeCallback(source)
    }, password);

    return new Promise<PdfDocumentObject>((resolve, reject) => {
      task.wait((result) => resolve(result), (error) => reject(error));
    });
  }

  private createRangeCallback(url: string) {
    return (offset: number, length: number) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.overrideMimeType('text/plain; charset=x-user-defined');
      xhr.setRequestHeader('Range', `bytes=${offset}-${offset + length - 1}`);
      xhr.send(null);

      if (xhr.status === 206) {
        return this.convertResponseToUint8Array(xhr.responseText);
      }
      throw new Error(`Failed to load range: ${xhr.status}`);
    };
  }

  private convertResponseToUint8Array(text: string): Uint8Array {
    const array = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      array[i] = text.charCodeAt(i) & 0xff;
    }
    return array;
  }
} 