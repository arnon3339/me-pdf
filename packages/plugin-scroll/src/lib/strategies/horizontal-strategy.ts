import { PdfPageObject } from "@embedpdf/models";
import { ViewportMetrics } from "@embedpdf/plugin-viewport";
import { BaseScrollStrategy, ScrollStrategyConfig } from "./base-strategy";
import { VirtualItem } from "../types/virtual-item";

export class HorizontalScrollStrategy extends BaseScrollStrategy {
  constructor(config?: ScrollStrategyConfig) {
    super(config);
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
    this.contentContainer.style.gap = `round(down, var(--scale-factor) * ${this.pageGap}px, 1px)`;
  }

  protected createVirtualItems(pdfPageObject: PdfPageObject[][]): VirtualItem[] {
    let offset = 0;
    
    return pdfPageObject.map((pagesInSpread, index) => {
      // Calculate size based on orientation
      const size = this.calculateItemSize(pagesInSpread);
      
      // Create the virtual item
      const item = new VirtualItem(
        pagesInSpread.map(page => page.index + 1),
        pagesInSpread,
        index,
        size,
        offset,
        this.getScaleFactorFn
      );
      
      // Update offset for the next item
      offset += size + this.pageGap;
      return item;
    });
  }

  protected calculateItemSize(pagesInSpread: PdfPageObject[]): number {
    return pagesInSpread.reduce((sum, page, i) => {
      // Add page width
      const width = page.size.width;
      // Add gap between pages (except after the last page in spread)
      const gap = i < pagesInSpread.length - 1 ? this.pageGap : 0;
      return sum + width + gap;
    }, 0);
  }

  /** Render a spread as a horizontal flex container */
  protected renderItem(item: VirtualItem): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'row';
    wrapper.style.gap = `round(down, var(--scale-factor) * ${this.pageGap}px, 1px)`;
    wrapper.style.alignItems = 'center';
    
    const maxHeight = Math.max(
      ...item.pages.map(page => page.size.height)
    );
    wrapper.style.height = `round(down, var(--scale-factor) * ${maxHeight}px, 1px)`;

    item.pages.forEach(page => {
      wrapper.appendChild(this.createPageElement(page, page.index + 1));
    });

    return wrapper;
  }

  protected updateSpacers(beforeSize: number, afterSize: number): void {
    // Use topSpacer as leftSpacer and bottomSpacer as rightSpacer
    this.topSpacer.style.width = `round(down, var(--scale-factor) * ${beforeSize}px, 1px)`;
    this.topSpacer.style.height = '100%';
    this.topSpacer.style.flexShrink = '0';
    
    this.bottomSpacer.style.width = `round(down, var(--scale-factor) * ${Math.max(0, afterSize)}px, 1px)`;
    this.bottomSpacer.style.height = '100%';
    this.bottomSpacer.style.flexShrink = '0';
  }

  protected getVisibleItems(viewport: ViewportMetrics): VirtualItem[] {
    return this.virtualItems.filter(item => {
      const itemRight = item.scaledOffset + item.scaledSize;
      const itemLeft = item.scaledOffset;
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