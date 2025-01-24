import { ILayer } from '../types';
import { PdfPageObject } from '@cloudpdf/models';
import { BaseLayer } from './BaseLayer';

export class TextLayer extends BaseLayer {
  id = 'text';
  zIndex = 2;

  async render(page: PdfPageObject, container: HTMLElement) {
    // Get text content from the page
  }

  async destroy() {
    // Cleanup if needed
  }
}