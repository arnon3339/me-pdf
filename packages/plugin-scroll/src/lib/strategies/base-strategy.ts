import { PdfPageObject } from "@embedpdf/models";
import { SpreadMetrics } from "@embedpdf/plugin-spread";
import { ViewportCapability, ViewportMetrics } from "@embedpdf/plugin-viewport";
import { ScrollMetrics, ScrollStrategyInterface, VirtualItem } from "../types";

export abstract class BaseScrollStrategy implements ScrollStrategyInterface {
  protected container!: HTMLElement;
  protected virtualItems: VirtualItem[] = [];
  protected renderedItems: Map<number, HTMLElement> = new Map();
  protected topSpacer!: HTMLElement;
  protected bottomSpacer!: HTMLElement;
  protected contentContainer!: HTMLElement;
  protected pages: PdfPageObject[] = [];
  protected viewport: ViewportCapability;
  
  protected metrics: ScrollMetrics = {
    currentPage: 1,
    visiblePages: [],
    scrollOffset: { x: 0, y: 0 },
    totalHeight: 0,
    totalWidth: 0
  };

  protected readonly PAGE_GAP = 20;
  protected readonly BUFFER_SIZE = 2;

  constructor(viewport: ViewportCapability) {
    this.viewport = viewport;
  }

  initialize(container: HTMLElement): void {
    this.container = container;
    this.setupVirtualScroller();
    this.setupContainer();
  }

  private setupVirtualScroller(): void {
    this.topSpacer = document.createElement('div');
    this.bottomSpacer = document.createElement('div');
    this.contentContainer = document.createElement('div');

    this.container.appendChild(this.topSpacer);
    this.container.appendChild(this.contentContainer);
    this.container.appendChild(this.bottomSpacer);
  }

  protected updateVirtualScroller(viewport: ViewportMetrics): void {
    const range = this.getVisibleRange(viewport);
    
    const totalSize = this.getTotalSize();
    const beforeSize = range.start > 0 ? this.virtualItems[range.start].offset : 0;
    const visibleSize = this.getVisibleSize(range);
    const afterSize = totalSize - (beforeSize + visibleSize);

    this.updateSpacers(beforeSize, afterSize);
    this.removeNonVisibleItems(range);
    this.addVisibleItems(range);
  }

  private getTotalSize(): number {
    return this.virtualItems.reduce((acc, item) => acc + item.size, 0) + 
           (this.PAGE_GAP * (this.virtualItems.length - 1));
  }

  private getVisibleSize(range: { start: number; end: number }): number {
    return this.virtualItems
      .slice(range.start, range.end + 1)
      .reduce((acc, item) => acc + item.size, 0) +
      (this.PAGE_GAP * (range.end - range.start));
  }

  protected getVisibleRange(viewport: ViewportMetrics): { start: number; end: number } {
    const scrollOffset = this.getScrollOffset(viewport);
    const clientSize = this.getClientSize(viewport);
    const viewportStart = scrollOffset;
    const viewportEnd = scrollOffset + clientSize;
    
    let startIndex = 0;
    while (
      startIndex < this.virtualItems.length && 
      (this.virtualItems[startIndex].offset + this.virtualItems[startIndex].size + this.PAGE_GAP) <= viewportStart
    ) {
      startIndex++;
    }
    
    let endIndex = startIndex;
    while (
      endIndex < this.virtualItems.length && 
      this.virtualItems[endIndex].offset <= viewportEnd
    ) {
      endIndex++;
    }

    return {
      start: Math.max(0, startIndex - this.BUFFER_SIZE),
      end: Math.min(this.virtualItems.length - 1, endIndex + this.BUFFER_SIZE - 1)
    };
  }

  private removeNonVisibleItems(range: { start: number; end: number }): void {
    for (const [index, element] of this.renderedItems) {
      if (index < range.start || index > range.end) {
        element.remove();
        this.renderedItems.delete(index);
      }
    }
  }

  private addVisibleItems(range: { start: number; end: number }): void {
    for (let i = range.start; i <= range.end; i++) {
      if (!this.renderedItems.has(i)) {
        const item = this.virtualItems[i];
        const element = this.renderItem(item);
        this.insertElementInOrder(element, i);
        this.renderedItems.set(i, element);
      }
    }
  }

  private insertElementInOrder(element: HTMLElement, index: number): void {
    let inserted = false;
    const currentElements = Array.from(this.contentContainer.children);
    
    for (let j = 0; j < currentElements.length; j++) {
      const currentIndex = Array.from(this.renderedItems.entries())
        .find(([_, el]) => el === currentElements[j])?.[0];
      
      if (currentIndex !== undefined && currentIndex > index) {
        this.contentContainer.insertBefore(element, currentElements[j]);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      this.contentContainer.appendChild(element);
    }
  }

  handleScroll(viewport: ViewportMetrics): void {
    this.updateVirtualScroller(viewport);
    const visibleItems = this.getVisibleItems(viewport);
    
    this.metrics.visiblePages = visibleItems.flatMap(item => item.pageNumbers);
    this.metrics.currentPage = this.metrics.visiblePages[0] || 1;
    this.metrics.scrollOffset = { 
      x: viewport.scrollLeft, 
      y: viewport.scrollTop 
    };
  }

  updateLayout(spreadMetrics: SpreadMetrics): void {
    if (!this.pages || this.pages.length === 0) return;
    this.calculateDimensions(spreadMetrics);
    this.updateVirtualScroller(this.viewport.getMetrics());
  }

  calculateDimensions(spreadMetrics: SpreadMetrics): void {
    this.virtualItems = this.createVirtualItems(spreadMetrics);
    this.updateMetrics();
  }

  setPages(pages: PdfPageObject[]): void {
    this.pages = pages;
  }

  scrollToPage(pageNumber: number): void {
    const item = this.virtualItems.find(item => 
      item.pageNumbers.includes(pageNumber)
    );
    
    if (item) {
      this.setScrollPosition(this.container, item.offset);
    }
  }

  getVirtualItems(): VirtualItem[] {
    return this.virtualItems;
  }

  destroy(): void {
    this.virtualItems = [];
    this.container.innerHTML = '';
  }

  protected createPageElement(page: PdfPageObject, pageNum: number): HTMLElement {
    const pageElement = document.createElement('div');
    
    pageElement.dataset.pageNumber = pageNum.toString();
    pageElement.style.width = `${page.size.width}px`;
    pageElement.style.height = `${page.size.height}px`;
    pageElement.style.backgroundColor = 'red';
    pageElement.style.display = 'flex';
    pageElement.style.alignItems = 'center';
    pageElement.style.justifyContent = 'center';
    
    const pageNumberElement = document.createElement('span');
    pageNumberElement.textContent = `Page ${pageNum}`;
    pageNumberElement.style.fontSize = '30px';
    pageNumberElement.style.color = 'white';
    pageElement.appendChild(pageNumberElement);
    
    return pageElement;
  }

  // Abstract methods that define orientation-specific behavior
  protected abstract setupContainer(): void;
  protected abstract updateSpacers(beforeSize: number, afterSize: number): void;
  protected abstract getVisibleItems(viewport: ViewportMetrics): VirtualItem[];
  protected abstract getScrollOffset(viewport: ViewportMetrics): number;
  protected abstract getClientSize(viewport: ViewportMetrics): number;
  protected abstract setScrollPosition(element: HTMLElement, position: number): void;
  protected abstract createVirtualItems(spreadMetrics: SpreadMetrics): VirtualItem[];
  protected abstract updateMetrics(): void;
  protected abstract renderItem(item: VirtualItem): HTMLElement;
} 