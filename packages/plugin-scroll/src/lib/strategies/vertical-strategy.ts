import { PdfPageObject } from "@embedpdf/models";
import { SpreadMetrics } from "@embedpdf/plugin-spread";
import { ViewportCapability, ViewportMetrics } from "@embedpdf/plugin-viewport";
import { VirtualItem } from "../types";
import { BaseScrollStrategy } from "./base-strategy";

export class VerticalScrollStrategy extends BaseScrollStrategy {
  protected pages: PdfPageObject[] = [];

  constructor(viewport: ViewportCapability) {
    super(viewport);
  }

  protected setupContainer(): void {
    // Setup main container
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';
    
    // Setup content container
    this.contentContainer.style.display = 'flex';
    this.contentContainer.style.flexDirection = 'column';
    this.contentContainer.style.alignItems = 'center';
    this.contentContainer.style.position = 'relative';
    this.contentContainer.style.minWidth = 'fit-content';
    this.contentContainer.style.boxSizing = 'border-box';
    this.contentContainer.style.gap = `${this.PAGE_GAP}px`;
  }

  protected createVirtualItems(spreadMetrics: SpreadMetrics): VirtualItem[] {
    let offset = 0;
    const items: VirtualItem[] = [];
    
    spreadMetrics.getAllSpreads().forEach((pagesInSpread, index) => {
      const spreadPages = pagesInSpread.map(pageNum => this.pages[pageNum - 1]);
      // Use the maximum height of pages in the spread
      const size = Math.max(...spreadPages.map(p => p.size.height));
      
      items.push({
        pageNumbers: pagesInSpread,
        index,
        size,
        offset
      });
      
      offset += size + this.PAGE_GAP;
    });

    return items;
  }

  protected updateMetrics(): void {
    if (this.virtualItems.length === 0) return;
    
    const lastItem = this.virtualItems[this.virtualItems.length - 1];
    this.metrics.totalHeight = lastItem.offset + lastItem.size;
    this.metrics.totalWidth = Math.max(
      ...this.virtualItems.map(item => 
        Math.max(...item.pageNumbers.map(pageNum => 
          this.pages[pageNum - 1].size.width
        ))
      )
    );
  }

  protected updateSpacers(beforeSize: number, afterSize: number): void {
    this.topSpacer.style.height = `${beforeSize}px`;
    this.topSpacer.style.width = '100%';
    
    this.bottomSpacer.style.height = `${Math.max(0, afterSize)}px`;
    this.bottomSpacer.style.width = '100%';
  }

  protected getVisibleItems(viewport: ViewportMetrics): VirtualItem[] {
    return this.virtualItems.filter(item => {
      const itemBottom = item.offset + item.size;
      const itemTop = item.offset;
      return itemBottom >= viewport.scrollTop && 
             itemTop <= viewport.scrollTop + viewport.clientHeight;
    });
  }

  protected getScrollOffset(viewport: ViewportMetrics): number {
    return viewport.scrollTop;
  }

  protected getClientSize(viewport: ViewportMetrics): number {
    return viewport.clientHeight;
  }

  protected setScrollPosition(element: HTMLElement, position: number): void {
    element.scrollTo({
      top: position,
      behavior: 'smooth'
    });
  }

  protected renderItem(item: VirtualItem): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.height = `${item.size}px`;
    wrapper.style.gap = `${this.PAGE_GAP}px`;
    wrapper.style.justifyContent = 'center';
    
    item.pageNumbers.forEach(pageNum => {
      const page = this.pages[pageNum - 1];
      wrapper.appendChild(this.createPageElement(page, pageNum));
    });

    return wrapper;
  }

  updateLayout(spreadMetrics: SpreadMetrics): void {
    if(this.pages && this.pages.length === 0) return;

    this.calculateDimensions(spreadMetrics);
    // Update virtual scroller with current viewport
    this.updateVirtualScroller(this.viewport.getMetrics());
  }
} 