import { PdfPageObject } from "@embedpdf/models";
import { ViewportMetrics } from "@embedpdf/plugin-viewport";
import { PageVisibilityMetrics, ScrollMetrics, ScrollStrategyInterface } from "../types";
import { VirtualItem } from "../types/virtual-item";

export interface ScrollStrategyConfig {
  pageGap?: number;
  bufferSize?: number;
  createPageElement?: (page: PdfPageObject, pageNum: number) => HTMLElement;
  getScaleFactor?: () => number;
}

export abstract class BaseScrollStrategy implements ScrollStrategyInterface {
  protected container!: HTMLElement;
  protected virtualItems: VirtualItem[] = [];
  protected renderedItems: Map<number, HTMLElement> = new Map();
  protected topSpacer!: HTMLElement;
  protected bottomSpacer!: HTMLElement;
  protected contentContainer!: HTMLElement;
  
  protected metrics: ScrollMetrics = {
    currentPage: 1,
    visiblePages: [],
    pageVisibilityMetrics: [],
    scrollOffset: { x: 0, y: 0 },
    totalHeight: 0,
    totalWidth: 0
  };

  protected pageGap: number;
  protected bufferSize: number;
  protected scaleFactor: number = 1;

  protected createPageElementFn: (page: PdfPageObject, pageNum: number) => HTMLElement;
  protected getScaleFactorFn?: () => number;

  constructor(config?: ScrollStrategyConfig) {
    // Use provided values or defaults
    this.pageGap = config?.pageGap ?? 20;
    this.bufferSize = config?.bufferSize ?? 2;
    this.getScaleFactorFn = config?.getScaleFactor;

    // Store the page element creation function
    if (config?.createPageElement) {
      this.createPageElementFn = config.createPageElement;
    } else {
      this.createPageElementFn = () => {
        throw new Error('createPageElement function not provided to ScrollStrategy');
      };
    }
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

  protected getTotalSize(): number {
    if (this.virtualItems.length === 0) return 0;
    
    const lastItem = this.virtualItems[this.virtualItems.length - 1];
    return lastItem.offset + lastItem.size;
  }

  private getVisibleSize(range: { start: number; end: number }): number {
    if (range.start >= this.virtualItems.length || range.end < range.start) {
      return 0;
    }
    
    const firstItem = this.virtualItems[range.start];
    const lastItem = this.virtualItems[range.end];
    
    // The visible size is the distance from the start of the first visible item
    // to the end of the last visible item
    return (lastItem.offset + lastItem.size) - firstItem.offset;
  }

  protected calculatePageVisibility(
    pageElement: HTMLElement, 
    viewport: ViewportMetrics
  ): PageVisibilityMetrics | null {
    const pageRect = pageElement.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    // Calculate intersection
    const intersection = {
      left: Math.max(pageRect.left, containerRect.left),
      top: Math.max(pageRect.top, containerRect.top),
      right: Math.min(pageRect.right, containerRect.right),
      bottom: Math.min(pageRect.bottom, containerRect.bottom)
    };
  
    // If there's no intersection, return null
    if (intersection.left >= intersection.right || intersection.top >= intersection.bottom) {
      return null;
    }
  
    const visibleWidth = intersection.right - intersection.left;
    const visibleHeight = intersection.bottom - intersection.top;
    const totalArea = pageRect.width * pageRect.height;
    const visibleArea = visibleWidth * visibleHeight;
    
    return {
      pageNumber: parseInt(pageElement.dataset.pageNumber || '0'),
      viewportX: intersection.left - containerRect.left,
      viewportY: intersection.top - containerRect.top,
      pageX: intersection.left - pageRect.left,
      pageY: intersection.top - pageRect.top,
      visibleWidth,
      visibleHeight,
      visiblePercentage: (visibleArea / totalArea) * 100
    };
  }

  protected getVisibleRange(viewport: ViewportMetrics): { start: number; end: number } {
    const scrollOffset = this.getScrollOffset(viewport);
    const clientSize = this.getClientSize(viewport);
    const viewportStart = scrollOffset;
    const viewportEnd = scrollOffset + clientSize;
    
    let startIndex = 0;
    while (
      startIndex < this.virtualItems.length && 
      (this.virtualItems[startIndex].scaledOffset + this.virtualItems[startIndex].scaledSize) <= viewportStart
    ) {
      startIndex++;
    }
    
    let endIndex = startIndex;
    while (
      endIndex < this.virtualItems.length && 
      this.virtualItems[endIndex].scaledOffset <= viewportEnd
    ) {
      endIndex++;
    }

    return {
      start: Math.max(0, startIndex - this.bufferSize),
      end: Math.min(this.virtualItems.length - 1, endIndex + this.bufferSize - 1)
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

  private removeAllRenderedItems(): void {  
    for (const [index, element] of this.renderedItems) {
      element.remove();
      this.renderedItems.delete(index);
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

  updateLayout(viewport: ViewportMetrics, pdfPageObject: PdfPageObject[][]): void {
    this.calculateDimensions(pdfPageObject);
    this.removeAllRenderedItems();
    this.handleScroll(viewport);
  }

  calculateDimensions(pdfPageObject: PdfPageObject[][]): void {
    this.virtualItems = this.createVirtualItems(pdfPageObject);
  }

  scrollToPage(pageNumber: number): void {
    const item = this.virtualItems.find(item => 
      item.pageNumbers.includes(pageNumber)
    );
    
    if (item) {
      this.setScrollPosition(this.container, item.scaledOffset);
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
    return this.createPageElementFn(page, pageNum);
  }

  // Abstract methods that define orientation-specific behavior
  protected abstract setupContainer(): void;
  protected abstract updateSpacers(beforeSize: number, afterSize: number): void;
  protected abstract getVisibleItems(viewport: ViewportMetrics): VirtualItem[];
  protected abstract getScrollOffset(viewport: ViewportMetrics): number;
  protected abstract getClientSize(viewport: ViewportMetrics): number;
  protected abstract setScrollPosition(element: HTMLElement, position: number): void;
  protected abstract createVirtualItems(pdfPageObject: PdfPageObject[][]): VirtualItem[];
  protected abstract renderItem(item: VirtualItem): HTMLElement;
} 