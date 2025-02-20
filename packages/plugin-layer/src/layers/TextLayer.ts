import { ILayer } from '../types';
import { PdfPageObject } from '@embedpdf/models';
import { BaseLayer } from './BaseLayer';

export class TextLayer extends BaseLayer {
  id = 'text';
  zIndex = 2;

  async render(page: PdfPageObject, container: HTMLElement) {
    if(!this.core) throw new Error('Plugin not initialized');

    const document = this.core.getDocument();
    if(!document) return;

    //const textRects = await this.core.engine.getPageTextRects(document, page, 1, 0);
    //console.log(textRects);
  }

  async destroy() {
    // Cleanup if needed
  }
}