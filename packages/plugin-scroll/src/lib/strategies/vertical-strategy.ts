import { PdfPageObject } from "@embedpdf/models";
import { SpreadMetrics } from "@embedpdf/plugin-spread";
import { ViewportCapability, ViewportMetrics } from "@embedpdf/plugin-viewport";
import { VirtualItem } from "../types";
import { BaseScrollStrategy } from "./base-strategy";

export class VerticalScrollStrategy extends BaseScrollStrategy {
  protected pages: PdfPageObject[] = [];
  protected viewport: ViewportCapability;

  constructor(viewport: ViewportCapability) {
    super();
    this.viewport = viewport;
  }

  protected setupContainer(): void {
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';
    this.contentContainer.style.display = 'flex';
    this.contentContainer.style.flexDirection = 'column';
    this.contentContainer.style.alignItems = 'center';
    this.contentContainer.style.position = 'relative';
    this.contentContainer.style.minWidth = 'fit-content';
    this.contentContainer.style.boxSizing = 'border-box';
    this.contentContainer.style.gap = `${this.PAGE_GAP}px`;
  }

  protected createVirtualItems(
    spreadMetrics: SpreadMetrics
  ): VirtualItem[] {
    let offset = 0;
    const items: VirtualItem[] = [];
    
    // Get all spreads and create one virtual item per spread
    const spreads = spreadMetrics.getAllSpreads();
    
    spreads.forEach((pagesInSpread, index) => {
      const spreadPages = pagesInSpread.map(pageNum => this.pages[pageNum - 1]);
      
      // Calculate maximum height in spread
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

  protected renderItem(item: VirtualItem): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.height = `${item.size}px`;
    wrapper.style.gap = `${this.PAGE_GAP}px`;
    
    // Create placeholder for each page in the spread
    item.pageNumbers.forEach(pageNum => {
      const pageElement = document.createElement('div');
      pageElement.dataset.pageNumber = pageNum.toString();
      pageElement.style.flex = '1';
      pageElement.style.backgroundColor = 'red';
      pageElement.style.height = `${this.pages[pageNum - 1].size.height}px`;
      pageElement.style.width = `${this.pages[pageNum - 1].size.width}px`;
      pageElement.style.color = 'white';
      pageElement.style.fontSize = '50px';
      pageElement.style.display = 'flex';
      pageElement.style.alignItems = 'center';
      pageElement.style.justifyContent = 'center';
      pageElement.innerHTML = `${pageNum}`;
      wrapper.appendChild(pageElement);
    });

    return wrapper;
  }

  handleScroll(viewport: ViewportMetrics): void {
    this.updateVirtualScroller(viewport);

    // Update metrics
    const visibleItems = this.virtualItems.filter(item => {
      const itemBottom = item.offset + item.size;
      const itemTop = item.offset;
      return itemBottom >= viewport.scrollTop && 
             itemTop <= viewport.scrollTop + viewport.clientHeight;
    });

    this.metrics.visiblePages = visibleItems.flatMap(item => item.pageNumbers);
    this.metrics.currentPage = this.metrics.visiblePages[0] || 1;
    this.metrics.scrollOffset = { x: viewport.scrollLeft, y: viewport.scrollTop };

    console.log('metrics', this.metrics);
  }

  scrollToPage(pageNumber: number): void {
    const item = this.virtualItems.find(item => 
      item.pageNumbers.includes(pageNumber)
    );
    
    if (item) {
      this.container.scrollTo({
        top: item.offset,
        behavior: 'smooth'
      });
    }
  }

  updateLayout(spreadMetrics: SpreadMetrics): void {
    if(this.pages && this.pages.length === 0) return;

    this.calculateDimensions(spreadMetrics);
    // Update virtual scroller with current viewport
    this.updateVirtualScroller(this.viewport.getMetrics());
  }

  setPages(pages: PdfPageObject[]): void {
    this.pages = pages;
  }
} 