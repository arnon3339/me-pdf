import { PdfPageObject } from "@embedpdf/models";
import { ViewportMetrics } from "@embedpdf/plugin-viewport";
import { VirtualItem } from "../types/virtual-item";
import { BaseScrollStrategy, ScrollStrategyConfig } from "./base-strategy";

export class VerticalScrollStrategy extends BaseScrollStrategy {
  constructor(config?: ScrollStrategyConfig) {
    super(config);
  }

  protected setupContainer(): void {
    // Setup main container
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';

    this.innerDiv.style.margin = '0px auto';
    
    // Setup content container
    this.contentContainer.style.display = 'flex';
    this.contentContainer.style.flexDirection = 'column';
    this.contentContainer.style.alignItems = 'center';
    this.contentContainer.style.position = 'relative';
    this.contentContainer.style.minWidth = 'fit-content';
    this.contentContainer.style.boxSizing = 'border-box';
    this.contentContainer.style.gap = `round(down, var(--scale-factor) * ${this.pageGap}px, 1px)`;
  }

  protected createVirtualItems(spreadPages: PdfPageObject[][]): VirtualItem[] {
    let offset = 0;

    return spreadPages.map((pagesInSpread, index) => {
      // Use the maximum height of pages in the spread
      const size = Math.max(...pagesInSpread.map(p => p.size.height));
      
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

  protected updateSpacers(beforeSize: number, afterSize: number): void {
    this.topSpacer.style.height = `round(down, var(--scale-factor) * ${beforeSize}px, 1px)`;
    this.topSpacer.style.width = '100%';
    
    this.bottomSpacer.style.height = `round(down, var(--scale-factor) * ${Math.max(0, afterSize)}px, 1px)`;
    this.bottomSpacer.style.width = '100%';
  }

  protected getVisibleItems(viewport: ViewportMetrics): VirtualItem[] {
    return this.virtualItems.filter(item => {
      const itemBottom = item.scaledOffset + item.scaledSize;
      const itemTop = item.scaledOffset;
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

  protected setScrollPosition(element: HTMLElement, position: number, behavior: ScrollBehavior = 'smooth'): void {
    requestAnimationFrame(() => {
      element.scrollTo({
        top: position,
        behavior
      });
    });
  }

  protected renderItem(item: VirtualItem): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    wrapper.style.height = `round(down, var(--scale-factor) * ${item.size}px, 1px)`;
    wrapper.style.gap = `round(down, var(--scale-factor) * ${this.pageGap}px, 1px)`;

    item.pages.forEach(page => {
      const pageElement = this.createPageElement(page, page.index + 1);
      wrapper.appendChild(pageElement);
      item.addPageElement(pageElement);    
    });

    item.setElement(wrapper);

    return wrapper;
  }

  /**
   * Updates the innerDiv with total content dimensions to prevent visual bouncing
   * when virtual elements are added/removed during scrolling
   */
  protected override updateTotalContentDimensions(pdfPageObject: PdfPageObject[][]): void {
    if (pdfPageObject.length === 0 || this.virtualItems.length === 0 || !this.innerDiv) {
      return;
    }
    
    // Get the last item to calculate total height
    const lastItem = this.virtualItems[this.virtualItems.length - 1];
    const totalHeight = lastItem.offset + lastItem.size;
    
    // Set total height
    this.innerDiv.style.height = `round(down, var(--scale-factor) * ${totalHeight}px, 1px)`;
    
    // Calculate max width based on the widest page/spread
    const totalWidth = Math.max(...pdfPageObject.map(spread => 
      spread.reduce((total, page, index) => {
        const pageWidth = page.size.width;
        const gap = index < spread.length - 1 ? this.pageGap : 0;
        return total + pageWidth + gap;
      }, 0)
    ));
    
    // Set total width
    this.innerDiv.style.width = `round(down, var(--scale-factor) * ${totalWidth}px, 1px)`;
  }
} 