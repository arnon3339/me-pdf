import { PdfPageObject } from "@embedpdf/models";
import { SpreadMetrics } from "@embedpdf/plugin-spread";
import { ViewportCapability, ViewportMetrics } from "@embedpdf/plugin-viewport";
import { VirtualItem } from "../types";
import { BaseScrollStrategy } from "./base-strategy";

export class HorizontalScrollStrategy extends BaseScrollStrategy {
  protected pages: PdfPageObject[] = [];
  protected viewport: ViewportCapability;

  constructor(viewport: ViewportCapability) {
    super();
    this.viewport = viewport;
  }

  /** Set up the container for horizontal scrolling */
  protected setupContainer(): void {
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'row';
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';

    this.contentContainer.style.display = 'flex';
    this.contentContainer.style.flexDirection = 'row';
    this.contentContainer.style.alignItems = 'center'; // Align pages vertically within spreads
    this.contentContainer.style.position = 'relative';
    this.contentContainer.style.minHeight = '100%'; // Ensure it fills the container height
    this.contentContainer.style.boxSizing = 'border-box';
    this.contentContainer.style.gap = `${this.PAGE_GAP}px`; // Gap between spreads
  }

  /** Create virtual items based on spread widths */
  protected createVirtualItems(spreadMetrics: SpreadMetrics): VirtualItem[] {
    let offset = 0;
    const items: VirtualItem[] = [];
    const spreads = spreadMetrics.getAllSpreads();

    spreads.forEach((pagesInSpread, index) => {
      const spreadPages = pagesInSpread.map(pageNum => this.pages[pageNum - 1]);
      // Calculate spread width: sum of page widths + gaps between pages
      const pageWidths = spreadPages.map(p => p.size.width);
      const spreadWidth = pageWidths.reduce((sum, w) => sum + w, 0) + (spreadPages.length - 1) * this.PAGE_GAP;

      items.push({
        pageNumbers: pagesInSpread,
        index,
        size: spreadWidth, // Size represents width in horizontal mode
        offset
      });

      offset += spreadWidth + this.PAGE_GAP; // Offset includes spread width + gap between spreads
    });

    return items;
  }

  /** Update scroll metrics with total width and height */
  protected updateMetrics(): void {
    if (this.virtualItems.length === 0) return;

    const lastItem = this.virtualItems[this.virtualItems.length - 1];
    this.metrics.totalWidth = lastItem.offset + lastItem.size; // Total width of all spreads
    this.metrics.totalHeight = Math.max(
      ...this.virtualItems.map(item =>
        Math.max(...item.pageNumbers.map(pageNum => this.pages[pageNum - 1].size.height))
      )
    ); // Maximum height across all spreads
  }

  /** Render a spread as a horizontal flex container */
  protected renderItem(item: VirtualItem): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'row';
    wrapper.style.width = `${item.size}px`; // Width is the spread size
    const maxHeight = Math.max(...item.pageNumbers.map(pageNum => this.pages[pageNum - 1].size.height));
    wrapper.style.height = `${maxHeight}px`; // Height is the tallest page in the spread
    wrapper.style.gap = `${this.PAGE_GAP}px`;
    wrapper.style.alignItems = 'center';

    item.pageNumbers.forEach(pageNum => {
      const pageElement = document.createElement('div');
      pageElement.dataset.pageNumber = pageNum.toString();
      pageElement.style.width = `${this.pages[pageNum - 1].size.width}px`;
      pageElement.style.height = `${this.pages[pageNum - 1].size.height}px`;
      pageElement.style.backgroundColor = 'red';
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

  /** Handle scroll events and update visible items */
  handleScroll(viewport: ViewportMetrics): void {
    this.updateVirtualScroller(viewport);

    const visibleItems = this.virtualItems.filter(item => {
      const itemRight = item.offset + item.size;
      const itemLeft = item.offset;
      return itemRight >= viewport.scrollLeft && itemLeft <= viewport.scrollLeft + viewport.clientWidth;
    });

    this.metrics.visiblePages = visibleItems.flatMap(item => item.pageNumbers);
    this.metrics.currentPage = this.metrics.visiblePages[0] || 1;
    this.metrics.scrollOffset = { x: viewport.scrollLeft, y: viewport.scrollTop };

    console.log('metrics', this.metrics);
  }

  /** Scroll to a specific page */
  scrollToPage(pageNumber: number): void {
    const item = this.virtualItems.find(item => item.pageNumbers.includes(pageNumber));
    if (item) {
      this.container.scrollTo({
        left: item.offset,
        behavior: 'smooth'
      });
    }
  }

  /** Update layout when spreads change */
  updateLayout(spreadMetrics: SpreadMetrics): void {
    if (!this.pages || this.pages.length === 0) return;
    this.calculateDimensions(spreadMetrics);
    this.updateVirtualScroller(this.viewport.getMetrics());
  }

  /** Store the document pages */
  setPages(pages: PdfPageObject[]): void {
    this.pages = pages;
  }

  /** Determine the visible range of items */
  protected getVisibleRange(viewport: ViewportMetrics): { start: number; end: number } {
    const { scrollLeft, clientWidth } = viewport;
    const viewportLeft = scrollLeft;
    const viewportRight = scrollLeft + clientWidth;

    let startIndex = 0;
    while (
      startIndex < this.virtualItems.length &&
      (this.virtualItems[startIndex].offset + this.virtualItems[startIndex].size + this.PAGE_GAP) <= viewportLeft
    ) {
      startIndex++;
    }

    let endIndex = startIndex;
    while (
      endIndex < this.virtualItems.length &&
      this.virtualItems[endIndex].offset <= viewportRight
    ) {
      endIndex++;
    }

    return {
      start: Math.max(0, startIndex - this.BUFFER_SIZE),
      end: Math.min(this.virtualItems.length - 1, endIndex + this.BUFFER_SIZE - 1)
    };
  }

  /** Update the virtual scroller with spacers and items */
  protected updateVirtualScroller(viewport: ViewportMetrics): void {
    const range = this.getVisibleRange(viewport);

    const totalWidth = this.virtualItems.reduce((acc, item) => acc + item.size, 0) +
                       (this.PAGE_GAP * (this.virtualItems.length - 1));
    const leftWidth = range.start > 0 ? this.virtualItems[range.start].offset : 0;
    const visibleItems = this.virtualItems.slice(range.start, range.end + 1);
    const visibleWidth = visibleItems.reduce((acc, item) => acc + item.size, 0) +
                         (this.PAGE_GAP * (visibleItems.length - 1));
    const rightWidth = totalWidth - (leftWidth + visibleWidth);

    // Update spacers (using topSpacer as leftSpacer, bottomSpacer as rightSpacer)
    this.topSpacer.style.width = `${leftWidth}px`;
    this.topSpacer.style.flexShrink = '0';
    this.topSpacer.style.height = '100%'; // Ensure spacers fill vertically
    this.bottomSpacer.style.width = `${Math.max(0, rightWidth)}px`;
    this.bottomSpacer.style.height = '100%';
    this.bottomSpacer.style.flexShrink = '0';

    // Remove old items
    for (const [index, element] of this.renderedItems) {
      if (index < range.start || index > range.end) {
        element.remove();
        this.renderedItems.delete(index);
      }
    }

    // Add new items
    for (let i = range.start; i <= range.end; i++) {
      if (!this.renderedItems.has(i)) {
        const item = this.virtualItems[i];
        const element = this.renderItem(item);
        let inserted = false;
        const currentElements = Array.from(this.contentContainer.children);

        for (let j = 0; j < currentElements.length; j++) {
          const currentIndex = Array.from(this.renderedItems.entries())
            .find(([_, el]) => el === currentElements[j])?.[0];
          if (currentIndex !== undefined && currentIndex > i) {
            this.contentContainer.insertBefore(element, currentElements[j]);
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
}