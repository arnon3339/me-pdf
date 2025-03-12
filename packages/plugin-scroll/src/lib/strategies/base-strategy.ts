import { PdfPageObject } from "@embedpdf/models";
import { ViewportMetrics } from "@embedpdf/plugin-viewport";
import { PageVisibilityMetrics, ScrollMetrics, ScrollStrategyInterface } from "../types";
import { VirtualItem } from "../types/virtual-item";

export interface ScrollStrategyConfig {
  pageGap?: number;
  viewportGap?: number;
  bufferSize?: number;
  createPageElement?: (page: PdfPageObject, pageNum: number) => HTMLElement;
  getScaleFactor?: () => number;
}

export abstract class BaseScrollStrategy implements ScrollStrategyInterface {
  protected container!: HTMLElement;
  protected renderedItems: Map<number, HTMLElement> = new Map();
  protected virtualItems: VirtualItem[] = [];
  protected topSpacer!: HTMLElement;
  protected bottomSpacer!: HTMLElement;
  protected contentContainer!: HTMLElement;
  
  protected metrics: ScrollMetrics = {
    currentPage: 1,
    visiblePages: [],
    pageVisibilityMetrics: [],
    renderedPageIndexes: [],
    scrollOffset: { x: 0, y: 0 },
  };

  protected pageGap: number;
  protected viewportGap: number;
  protected bufferSize: number;
  protected scaleFactor: number = 1;

  protected createPageElementFn: (page: PdfPageObject, pageNum: number) => HTMLElement;
  protected getScaleFactorFn: () => number;

  constructor(config?: ScrollStrategyConfig) {
    // Use provided values or defaults
    this.pageGap = config?.pageGap ?? 20;
    this.viewportGap = config?.viewportGap ?? 20;
    this.bufferSize = config?.bufferSize ?? 2;
    this.getScaleFactorFn = config?.getScaleFactor ?? (() => 1);

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

    const scale = this.getScaleFactorFn();
    
    return {
      pageNumber: parseInt(pageElement.dataset.pageNumber || '0'),
      viewportX: intersection.left - containerRect.left,
      viewportY: intersection.top - containerRect.top,
      pageX: (intersection.left - pageRect.left) / scale,
      pageY: (intersection.top - pageRect.top) / scale,
      visibleWidth: visibleWidth / scale,
      visibleHeight: visibleHeight / scale,
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
        // Also clear the element reference in the virtual item
        if (this.virtualItems[index]) {
          this.virtualItems[index].clearElements();
        }
      }
    }
  } 

  private removeAllRenderedItems(): void {  
    for (const [index, element] of this.renderedItems) {
      element.remove();
      this.renderedItems.delete(index);
      // Also clear the element reference in the virtual item
      if (this.virtualItems[index]) {
        this.virtualItems[index].clearElements();
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

  handleScroll(viewport: ViewportMetrics): ScrollMetrics {
    this.updateVirtualScroller(viewport);
    const visibleItems = this.getVisibleItems(viewport);
    
    this.metrics.pageVisibilityMetrics = visibleItems
      .flatMap(item => item.pageElements.map(pageElement => 
        this.calculatePageVisibility(pageElement)
      ).filter((metrics): metrics is PageVisibilityMetrics => 
        metrics !== null
      ));
    this.metrics.visiblePages = visibleItems.flatMap(item => item.pageNumbers);
    this.metrics.renderedPageIndexes = Array.from(this.renderedItems.keys()).sort((a, b) => a - b);
    // Set current page using the dedicated function
    this.metrics.currentPage = this.determineCurrentPage(this.metrics.pageVisibilityMetrics, viewport);
    
    this.metrics.scrollOffset = { 
      x: viewport.scrollLeft, 
      y: viewport.scrollTop 
    };

    return this.metrics;
  }

  /**
   * Determine the most appropriate current page based on visibility and position
   * @param visibilityMetrics - Array of page visibility metrics
   * @param viewport - Current viewport metrics
   * @returns The page number that should be considered current
   */
  protected determineCurrentPage(visibilityMetrics: PageVisibilityMetrics[], viewport: ViewportMetrics): number {
    if (visibilityMetrics.length === 0) {
      return 1; // Default to page 1 if no pages are visible
    }
    
    // Find the highest visibility percentage
    const maxVisibility = Math.max(
      ...visibilityMetrics.map(m => m.visiblePercentage)
    );
    
    // Filter to get all pages with that max visibility
    const mostVisiblePages = visibilityMetrics.filter(
      m => m.visiblePercentage === maxVisibility
    );
    
    if (mostVisiblePages.length === 1) {
      // If there's only one page with max visibility, use it
      return mostVisiblePages[0].pageNumber;
    } 
    
    // If multiple pages have the same visibility, find the most centered one
    const viewportCenterX = viewport.clientWidth / 2;
    const viewportCenterY = viewport.clientHeight / 2;
    
    // Calculate distances to center for each page
    const pagesWithDistances = mostVisiblePages.map(page => {
      const pageCenterX = page.viewportX + (page.visibleWidth / 2);
      const pageCenterY = page.viewportY + (page.visibleHeight / 2);
      
      const distance = Math.sqrt(
        Math.pow(pageCenterX - viewportCenterX, 2) + 
        Math.pow(pageCenterY - viewportCenterY, 2)
      );
      
      return { page, distance };
    });
    
    // Sort by distance (closest first) and take the first one
    pagesWithDistances.sort((a, b) => a.distance - b.distance);
    return pagesWithDistances[0].page.pageNumber;
  }

  updateLayout(viewport: ViewportMetrics, pdfPageObject: PdfPageObject[][]): ScrollMetrics {
    const currentPage = this.metrics.currentPage;
    this.calculateDimensions(pdfPageObject);
    this.removeAllRenderedItems();
    
    const newScrollMetrics = this.handleScroll(viewport);

    this.scrollToPage(currentPage, 'instant');

    return newScrollMetrics;
  } 

  calculateDimensions(pdfPageObject: PdfPageObject[][]): void {
    this.virtualItems = this.createVirtualItems(pdfPageObject);
  }

  scrollToPage(pageNumber: number, behavior?: ScrollBehavior): void {
    const item = this.virtualItems.find(item => 
      item.pageNumbers.includes(pageNumber)
    );
    
    if (item) {
      // Adjust scroll position by subtracting the viewportGap to position the page exactly at the edge
      // This compensates for the padding added to the viewport container
      const adjustedPosition = Math.max(0, item.scaledOffset + (this.viewportGap * this.getScaleFactorFn()));
      
      this.setScrollPosition(this.container, adjustedPosition, behavior);
    }
  }

  scrollToNextPage(): void {
    const currentPage = this.metrics.currentPage;
    
    // Find the current virtual item index
    const currentItemIndex = this.virtualItems.findIndex(item => 
      item.pageNumbers.includes(currentPage)
    );
    
    // Move to the next virtual item if available
    if (currentItemIndex >= 0 && currentItemIndex < this.virtualItems.length - 1) {
      const nextItem = this.virtualItems[currentItemIndex + 1];
      // Adjust scroll position by subtracting the viewportGap
      const adjustedPosition = Math.max(0, nextItem.scaledOffset + (this.viewportGap * this.getScaleFactorFn()));
      
      this.setScrollPosition(this.container, adjustedPosition);
    }
  }

  scrollToPreviousPage(): void {
    const currentPage = this.metrics.currentPage;
    
    // Find the current virtual item index
    const currentItemIndex = this.virtualItems.findIndex(item => 
      item.pageNumbers.includes(currentPage)
    );
    
    // Move to the previous virtual item if available
    if (currentItemIndex > 0) {
      const prevItem = this.virtualItems[currentItemIndex - 1];
      // Adjust scroll position by subtracting the viewportGap
      const adjustedPosition = Math.max(0, prevItem.scaledOffset + (this.viewportGap * this.getScaleFactorFn()));
      
      this.setScrollPosition(this.container, adjustedPosition);
    }
  }

  getVirtualItems(): VirtualItem[] {
    return this.virtualItems;
  }

  getMetrics(): ScrollMetrics {
    return this.metrics;
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
  protected abstract setScrollPosition(element: HTMLElement, position: number, behavior?: ScrollBehavior): void;
  protected abstract createVirtualItems(pdfPageObject: PdfPageObject[][]): VirtualItem[];
  protected abstract renderItem(item: VirtualItem): HTMLElement;
} 