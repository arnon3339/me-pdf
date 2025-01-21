import { NavigationState } from '../types';
import { ScrollModeBase } from './base';

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
  private pageHeights: Map<number, number> = new Map();
  private bufferPages = 2; // Number of pages to keep rendered above/below viewport
  private intersectionObserver: IntersectionObserver;

  constructor(container: HTMLElement, state: NavigationState) {
    super(container, state);
    
    // Create main structure
    this.topSpacer = document.createElement('div');
    this.bottomSpacer = document.createElement('div');
    this.pagesContainer = document.createElement('div');
    
    this.setupContainer();

    // Setup intersection observer
    this.intersectionObserver = new IntersectionObserver(this.updateVisibleRange.bind(this), {
      root: this.container,
      threshold: [0.1, 0.5, 0.9]
    });
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
  }

  private calculateVisibleRange(): VisibleRange {
    const scrollTop = this.container.scrollTop;
    const viewportHeight = this.container.clientHeight;
    
    // Calculate total height up to each page (memoize this if possible)
    const heightsUpToPage: number[] = [];
    let accHeight = 0;
    
    for (let i = 1; i <= this.state.totalPages; i++) {
      accHeight += (this.pageHeights.get(i) || 0) + 20;
      heightsUpToPage[i] = accHeight;
    }
    
    // Binary search for start page
    let startPage = this.binarySearchPage(heightsUpToPage, scrollTop);
    startPage = Math.max(1, startPage - this.bufferPages);
    
    // Binary search for end page
    let endPage = this.binarySearchPage(heightsUpToPage, scrollTop + viewportHeight * 1.5);
    endPage = Math.min(this.state.totalPages, endPage + this.bufferPages);

    // Calculate most visible page
    let maxVisibleArea = 0;
    let mostVisiblePage = this.state.currentPage;

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const pageHeight = this.pageHeights.get(pageNum) || 0;
      const pageTop = heightsUpToPage[pageNum - 1] || 0;
      const pageBottom = pageTop + pageHeight;
      
      // Calculate intersection with viewport
      const visibleTop = Math.max(scrollTop, pageTop);
      const visibleBottom = Math.min(scrollTop + viewportHeight, pageBottom);
      const visibleArea = Math.max(0, visibleBottom - visibleTop);

      if (visibleArea > maxVisibleArea) {
        maxVisibleArea = visibleArea;
        mostVisiblePage = pageNum;
      }
    }

    const topSpacerHeight = startPage > 1 ? heightsUpToPage[startPage - 1] : 0;
    const bottomSpacerHeight = endPage < this.state.totalPages ? 
      heightsUpToPage[this.state.totalPages] - heightsUpToPage[endPage] : 0;

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
      console.log('pageChange event', range.mostVisiblePage);
      this.state.currentPage = range.mostVisiblePage;
      // Emit page change event
    }

    // Update spacer heights
    this.topSpacer.style.height = `${range.topSpacerHeight}px`;
    this.bottomSpacer.style.height = `${range.bottomSpacerHeight}px`;

    // Remove pages that are no longer visible
    for (const [pageNum, element] of this.visiblePages.entries()) {
      if (pageNum < range.startPage || pageNum > range.endPage) {
        this.intersectionObserver.unobserve(element);
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
        this.intersectionObserver.observe(pageElement);
      }
    }
  }

  destroy(): void {
    this.intersectionObserver.disconnect();
    this.visiblePages.clear();
    this.pageHeights.clear();
    this.container.innerHTML = '';
  }

  async goToPage(pageNumber: number): Promise<void> {
    let accHeight = 0;
  
    for (let i = 1; i < pageNumber; i++) {
      accHeight += (this.pageHeights.get(i) || 0) + 20;
    }
    this.container.scrollTo({
      top: accHeight,
      behavior: 'smooth'
    });
  }

  updateLayout(): void {
    // Calculate initial page heights based on page dimensions and zoom
    this.state.pages.forEach((page, index) => {
      const height = page.page.size.height * this.state.zoomLevel;
      this.pageHeights.set(index + 1, height);
    });

    // Render initial visible range
    if(this.state.pages.length > 0) {
      this.updateVisibleRange();
    }
  }
}