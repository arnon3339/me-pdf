import { PdfPageObject } from "@embedpdf/models";
import { SpreadMetrics } from "@embedpdf/plugin-spread";
import { ViewportCapability, ViewportMetrics } from "@embedpdf/plugin-viewport";
import { VirtualItem } from "../types";
import { BaseScrollStrategy } from "./base-strategy";

export class HorizontalScrollStrategy extends BaseScrollStrategy {
  protected pages: PdfPageObject[] = [];

  constructor(viewport: ViewportCapability) {
    super(viewport);
  }

  /** Set up the container for horizontal scrolling */
  protected setupContainer(): void {
    // Setup main container
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'row';
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';

    // Setup content container
    this.contentContainer.style.display = 'flex';
    this.contentContainer.style.flexDirection = 'row';
    this.contentContainer.style.alignItems = 'center';
    this.contentContainer.style.position = 'relative';
    this.contentContainer.style.minHeight = '100%';
    this.contentContainer.style.boxSizing = 'border-box';
    this.contentContainer.style.gap = `${this.PAGE_GAP}px`;
  }

  /** Create virtual items based on spread widths */
  protected createVirtualItems(spreadMetrics: SpreadMetrics): VirtualItem[] {
    let offset = 0;
    return spreadMetrics.getAllSpreads().map((pagesInSpread, index) => {
      const spreadPages = pagesInSpread.map(pageNum => this.pages[pageNum - 1]);
      const size = spreadPages.reduce((sum, page) => sum + page.size.width, 0) + 
                  ((spreadPages.length - 1) * this.PAGE_GAP);
      
      const item = { pageNumbers: pagesInSpread, index, size, offset };
      offset += size + this.PAGE_GAP;
      return item;
    });
  }

  /** Update scroll metrics with total width and height */
  protected updateMetrics(): void {
    if (this.virtualItems.length === 0) return;
    
    const lastItem = this.virtualItems[this.virtualItems.length - 1];
    this.metrics.totalWidth = lastItem.offset + lastItem.size;
    this.metrics.totalHeight = Math.max(
      ...this.virtualItems.map(item => 
        Math.max(...item.pageNumbers.map(pageNum => 
          this.pages[pageNum - 1].size.height
        ))
      )
    );
  }

  /** Render a spread as a horizontal flex container */
  protected renderItem(item: VirtualItem): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'row';
    wrapper.style.gap = `${this.PAGE_GAP}px`;
    wrapper.style.alignItems = 'center';
    
    const maxHeight = Math.max(
      ...item.pageNumbers.map(pageNum => this.pages[pageNum - 1].size.height)
    );
    wrapper.style.height = `${maxHeight}px`;

    item.pageNumbers.forEach(pageNum => {
      const page = this.pages[pageNum - 1];
      wrapper.appendChild(this.createPageElement(page, pageNum));
    });

    return wrapper;
  }

  protected updateSpacers(beforeSize: number, afterSize: number): void {
    // Use topSpacer as leftSpacer and bottomSpacer as rightSpacer
    this.topSpacer.style.width = `${beforeSize}px`;
    this.topSpacer.style.height = '100%';
    this.topSpacer.style.flexShrink = '0';
    
    this.bottomSpacer.style.width = `${Math.max(0, afterSize)}px`;
    this.bottomSpacer.style.height = '100%';
    this.bottomSpacer.style.flexShrink = '0';
  }

  protected getVisibleItems(viewport: ViewportMetrics): VirtualItem[] {
    return this.virtualItems.filter(item => {
      const itemRight = item.offset + item.size;
      const itemLeft = item.offset;
      return itemRight >= viewport.scrollLeft && 
             itemLeft <= viewport.scrollLeft + viewport.clientWidth;
    });
  }

  protected getScrollOffset(viewport: ViewportMetrics): number {
    return viewport.scrollLeft;
  }

  protected getClientSize(viewport: ViewportMetrics): number {
    return viewport.clientWidth;
  }

  protected setScrollPosition(element: HTMLElement, position: number): void {
    element.scrollTo({
      left: position,
      behavior: 'smooth'
    });
  }
}