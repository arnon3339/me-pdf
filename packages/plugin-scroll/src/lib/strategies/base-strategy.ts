import { PdfPageObject } from "@embedpdf/models";
import { SpreadMetrics } from "@embedpdf/plugin-spread";
import { ViewportMetrics } from "@embedpdf/plugin-viewport";
import { ScrollMetrics, ScrollStrategyInterface, VirtualItem } from "../types";

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
    scrollOffset: { x: 0, y: 0 },
    totalHeight: 0,
    totalWidth: 0
  };

  protected readonly PAGE_GAP = 20;
  protected readonly BUFFER_SIZE = 2;

  initialize(container: HTMLElement): void {
    this.container = container;
    this.setupVirtualScroller();
    this.setupContainer();
  }

  private setupVirtualScroller(): void {
    // Create spacers and content container
    this.topSpacer = document.createElement('div');
    this.bottomSpacer = document.createElement('div');
    this.contentContainer = document.createElement('div');

    // Basic setup for spacers
    this.topSpacer.style.width = '100%';
    this.bottomSpacer.style.width = '100%';

    // Append elements
    this.container.appendChild(this.topSpacer);
    this.container.appendChild(this.contentContainer);
    this.container.appendChild(this.bottomSpacer);
  }

  protected getVisibleRange(viewport: ViewportMetrics): { start: number; end: number } {
    const { scrollTop, clientHeight } = viewport;
    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + clientHeight;
    
    // Find the first visible item
    let startIndex = 0;
    while (
      startIndex < this.virtualItems.length && 
      (this.virtualItems[startIndex].offset + this.virtualItems[startIndex].size + this.PAGE_GAP) <= viewportTop
    ) {
      startIndex++;
    }
    
    // Find the last visible item
    let endIndex = startIndex;
    while (
      endIndex < this.virtualItems.length && 
      this.virtualItems[endIndex].offset <= viewportBottom
    ) {
      endIndex++;
    }

    // Add buffer and ensure bounds
    return {
      start: Math.max(0, startIndex - this.BUFFER_SIZE),
      end: Math.min(this.virtualItems.length - 1, endIndex + this.BUFFER_SIZE - 1)
    };
  }

  protected updateVirtualScroller(viewport: ViewportMetrics): void {
    const range = this.getVisibleRange(viewport);
    
    // Calculate heights
    const totalHeight = this.virtualItems.reduce((acc, item) => acc + item.size, 0) + 
                       (this.PAGE_GAP * (this.virtualItems.length - 1));
    
    const topHeight = range.start > 0
      ? this.virtualItems[range.start].offset
      : 0;

    const bottomHeight = totalHeight - (
      topHeight + 
      this.virtualItems.slice(range.start, range.end + 1)
        .reduce((acc, item) => acc + item.size, 0) +
      (this.PAGE_GAP * (range.end - range.start))
    );

    // 1. Update spacers
    this.topSpacer.style.height = `${topHeight}px`;
    this.bottomSpacer.style.height = `${Math.max(0, bottomHeight)}px`;

    // 2. Remove old items
    for (const [index, element] of this.renderedItems) {
      if (index < range.start || index > range.end) {
        element.remove();
        this.renderedItems.delete(index);
      }
    }

    // 3. Add new items
    for (let i = range.start; i <= range.end; i++) {
      if (!this.renderedItems.has(i)) {
        const item = this.virtualItems[i];
        const element = this.renderItem(item);
        
        // Find where to insert the new element
        let inserted = false;
        const currentElements = Array.from(this.contentContainer.children);
        
        for (let j = 0; j < currentElements.length; j++) {
          const currentElement = currentElements[j];
          const currentIndex = Array.from(this.renderedItems.entries())
            .find(([_, el]) => el === currentElement)?.[0];
          
          if (currentIndex !== undefined && currentIndex > i) {
            this.contentContainer.insertBefore(element, currentElement);
            inserted = true;
            break;
          }
        }
        
        if (!inserted) {
          this.contentContainer.appendChild(element);
        }
        
        this.renderedItems.set(i, element);
      }
    }
  }

  protected abstract renderItem(item: VirtualItem): HTMLElement;

  protected abstract setupContainer(): void;

  abstract updateLayout(spreadMetrics: SpreadMetrics): void;
  
  abstract handleScroll(viewport: ViewportMetrics): void;
  
  abstract scrollToPage(pageNumber: number): void;

  getVirtualItems(): VirtualItem[] {
    return this.virtualItems;
  }

  calculateDimensions(spreadMetrics: SpreadMetrics): void {
    this.virtualItems = this.createVirtualItems(spreadMetrics);
    this.updateMetrics();
  }

  protected abstract createVirtualItems(    
    spreadMetrics: SpreadMetrics
  ): VirtualItem[];

  protected abstract updateMetrics(): void;

  destroy(): void {
    this.virtualItems = [];
    this.container.innerHTML = '';
  }
} 