import { PdfPageObject } from '@embedpdf/models';

export interface PageContainerOptions {
  page: PdfPageObject;
  container?: HTMLElement;
}

export class PageContainer {
  readonly element: HTMLElement;
  readonly page: PdfPageObject;

  constructor(options: PageContainerOptions) {
    this.page = options.page;
    this.element = options.container || this.createContainer();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'pdf-page';
    container.setAttribute('data-page', String(this.page.index));
    
    container.style.width = `${this.page.size.width}px`;
    container.style.height = `${this.page.size.height}px`;
    container.style.width = `round(down, var(--scale-factor) * ${this.page.size.width}px, 1px)`;
    container.style.height = `round(down, var(--scale-factor) * ${this.page.size.height}px, 1px)`;
    container.style.position = 'relative';
    container.style.backgroundColor = 'white';
    container.style.margin = '0 auto';
    
    return container;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    this.element.remove();
  }
} 