import { ZoomChangeEvent } from '../types';
import { ScrollModeBase, ScrollModeBaseOptions } from './base';

interface VisibleRange {
  startPage: number;
  endPage: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
  mostVisiblePage: number;
}

export class ContinuousScrollMode extends ScrollModeBase {
  private topSpacer: HTMLElement;
  private bottomSpacer: HTMLElement;
  private pagesContainer: HTMLElement;
  private visiblePages: Map<number, HTMLElement> = new Map();
  private bufferPages = 2; // Number of pages to keep rendered above/below viewport
  private scrollDebounceTimeout: number | null = null;
  private readonly SCROLL_DEBOUNCE_MS = 100; // Adjust this value as needed

  constructor(options: ScrollModeBaseOptions) {
    super(options);
    
    // Create main structure
    this.topSpacer = document.createElement('div');
    this.bottomSpacer = document.createElement('div');
    this.pagesContainer = document.createElement('div');
    
    this.setupContainer();
    
    // Replace intersection observer with scroll listener
    this.container.addEventListener('scroll', this.handleScroll.bind(this));
  }

  private setupContainer(): void {
    // Setup container
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';
    
    // Setup spacers
    this.topSpacer.style.width = '100%';
    this.bottomSpacer.style.width = '100%';
    
    // Setup pages container
    this.pagesContainer.style.display = 'flex';
    this.pagesContainer.style.flexDirection = 'column';
    this.pagesContainer.style.alignItems = 'center';
    this.pagesContainer.style.gap = '20px';
    this.pagesContainer.style.position = 'relative';
    this.pagesContainer.style.minWidth = 'fit-content'; // Allow container to expand with content
    this.pagesContainer.style.boxSizing = 'border-box';
    
    // Append elements in correct order
    this.container.appendChild(this.topSpacer);
    this.container.appendChild(this.pagesContainer);
    this.container.appendChild(this.bottomSpacer);
  }

  initialize(): void {
    this.updateLayout();

    this.core.on('zoom:change', this.zoomChangeHandler);
  }

  private zoomChangeHandler = (zoomChange: ZoomChangeEvent) => {
    const { metrics } = zoomChange;

    const pagePositions = this.viewportTracker.getPagePositions();
    const lastPage = this.state.totalPages;
    const lastPagePos = pagePositions.get(lastPage)!;
    const newTotalHeight = lastPagePos.top + lastPagePos.height + 20;

    const newScrollTop = metrics.relativePosition.y * 
      (newTotalHeight - metrics.viewportHeight);

    const containerWidth = this.container.clientWidth;
    const newContentWidth = this.container.scrollWidth;
    const oldContentWidth = metrics.scrollWidth;

    let newScrollLeft;
    if (oldContentWidth <= containerWidth && newContentWidth > containerWidth) {
      // if the content was smaller than the container and is now larger, center it
      newScrollLeft = (newContentWidth - containerWidth) / 2;
    } else {
      // Otherwise maintain relative position
      newScrollLeft = metrics.relativePosition.x * 
        (newContentWidth - containerWidth);
    }
          
    // Apply new scroll position
    this.container.scrollTop = newScrollTop;
    this.container.scrollLeft = newScrollLeft;
    
    // Update visible range
    this.updateVisibleRange();
  };

  private handleScroll = () => {
    if (this.scrollDebounceTimeout) {
      window.clearTimeout(this.scrollDebounceTimeout);
    }

    this.scrollDebounceTimeout = window.setTimeout(() => {
      this.updateVisibleRange();
    }, this.SCROLL_DEBOUNCE_MS);
  };

  private calculateVisibleRange(): VisibleRange {
    const { pagePositions, viewportRegions } = this.getViewportState(true);
    const scrollTop = this.container.scrollTop;
    const viewportHeight = this.container.clientHeight;
    
    // Binary search using cached positions - just use tops since they include accumulated heights
    const heightsArray = Array.from(pagePositions.values())
      .map(pos => pos.top);
    
    let startPage = this.binarySearchPage(heightsArray, scrollTop);
    startPage = Math.max(1, startPage - this.bufferPages);
    
    let endPage = this.binarySearchPage(heightsArray, scrollTop + viewportHeight * 1.5);
    endPage = Math.min(this.state.totalPages, endPage + this.bufferPages);

    // Use ViewportTracker's visible regions to determine most visible page
    const mostVisiblePage = viewportRegions.length > 0 
      ? viewportRegions.reduce((prev, current) => 
          current.visiblePercentage > prev.visiblePercentage ? current : prev
        ).pageNumber
      : this.state.currentPage;

    const topSpacerHeight = startPage > 1 
    ? (pagePositions.get(startPage - 1)?.top ?? 0) + 
      (pagePositions.get(startPage - 1)?.height ?? 0) + 20
    : 0;

    const bottomSpacerHeight = endPage < this.state.totalPages 
      ? pagePositions.get(this.state.totalPages)!.top - 
        pagePositions.get(endPage)!.top
      : 0;

    return { 
      startPage, 
      endPage, 
      topSpacerHeight, 
      bottomSpacerHeight,
      mostVisiblePage 
    };
  }

  private binarySearchPage(heightsUpToPage: number[], targetHeight: number): number {
    let left = 1;
    let right = heightsUpToPage.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (heightsUpToPage[mid] === targetHeight) {
        return mid;
      }
      if (heightsUpToPage[mid] < targetHeight) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    return left;
  }

  private updateVisibleRange(): void {
    const range = this.calculateVisibleRange();
    
    // Update current page if changed
    if (range.mostVisiblePage !== this.state.currentPage) {
      this.state.currentPage = range.mostVisiblePage;
      this.core.emit('navigation:pageChanged', this.state.currentPage);
    }

    // Update spacer heights
    this.topSpacer.style.height = `${range.topSpacerHeight}px`;
    this.bottomSpacer.style.height = `${range.bottomSpacerHeight}px`;

    // Remove pages that are no longer visible
    for (const [pageNum, element] of this.visiblePages.entries()) {
      if (pageNum < range.startPage || pageNum > range.endPage) {
        element.remove();
        this.visiblePages.delete(pageNum);
      }
    }

    // Add new pages that should be visible
    const pageNumbers = Array.from(
      { length: range.endPage - range.startPage + 1 }, 
      (_, i) => range.startPage + i
    );

    for (const pageNum of pageNumbers) {
      if (!this.visiblePages.has(pageNum)) {
        const pageElement = this.state.pages[pageNum - 1].element;
        
        // Find the correct insertion point
        const nextPageNum = pageNumbers.find(num => 
          num > pageNum && this.visiblePages.has(num)
        );
        
        if (nextPageNum && this.visiblePages.get(nextPageNum)) {
          const nextElement = this.visiblePages.get(nextPageNum)!;
          this.pagesContainer.insertBefore(pageElement, nextElement);
        } else {
          this.pagesContainer.appendChild(pageElement);
        }
        
        this.visiblePages.set(pageNum, pageElement);
      }
    }
  }

  destroy(): void {
    this.core.removeListener('zoom:change', this.zoomChangeHandler);
    if (this.scrollDebounceTimeout) {
      window.clearTimeout(this.scrollDebounceTimeout);
    }
    this.container.removeEventListener('scroll', this.handleScroll);
    this.visiblePages.clear();
    this.container.innerHTML = '';
  }

  async goToPage(pageNumber: number): Promise<void> {
    const pagePositions = this.viewportTracker.getPagePositions();
    const position = pagePositions.get(pageNumber);
    
    if (position) {
      this.container.scrollTo({
        top: position.top,
        behavior: 'smooth'
      });
    }
  }

  updateLayout(): void {
    // Render initial visible range
    if(this.state.pages.length > 0) {
      this.updateVisibleRange();
    }
  }
}