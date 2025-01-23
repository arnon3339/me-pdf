import { ILayer } from '../types';
import { PdfPageObject } from '@cloudpdf/models';

export class TextLayer implements ILayer {
  id = 'text';
  zIndex = 1;

  async render(page: PdfPageObject, container: HTMLElement) {
    // Get text content from the page
    const textElement = document.createElement('h1');
    textElement.textContent = `Page ${page.index + 1}`;
    container.appendChild(textElement);
  }

  async destroy() {
    // Cleanup if needed
  }
}