import { PdfPageObject } from "@embedpdf/models";

export class VirtualItem {
  public element: HTMLElement | null = null;
  public pageElements: HTMLElement[] = [];

  constructor(
    public readonly pageNumbers: number[],
    public readonly pages: PdfPageObject[],
    public readonly index: number,
    public readonly size: number,
    public offset: number,
    private getScaleFactor: () => number = () => 1
  ) {}

  get scaledSize(): number {
    return this.size * this.getScaleFactor();
  }

  get scaledOffset(): number {
    return this.offset * this.getScaleFactor();
  }

  setElement(element: HTMLElement): void {
    this.element = element;
  }

  addPageElement(pageElement: HTMLElement): void {
    this.pageElements.push(pageElement);
  }

  clearElements(): void {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
    this.element = null;
    this.pageElements = [];
  }

  isRendered(): boolean {
    return this.element !== null;
  }
} 