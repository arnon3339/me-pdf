import { BaseLayerPlugin, LayerRenderOptions } from "@embedpdf/plugin-layer";
import { SearchLayerConfig } from "./types";
import { PluginRegistry } from "@embedpdf/core";
import { PdfDocumentObject, PdfEngine, PdfPageObject, Rect, SearchResult } from "@embedpdf/models";
import { SearchPlugin, SearchCapability, SearchState, DEFAULT_STATE } from "@embedpdf/plugin-search";
import { ScrollPlugin, ScrollCapability } from "@embedpdf/plugin-scroll";
// Define cache data type for the search layer
interface SearchLayerCacheData {
  container: HTMLElement;
}

// Define data structure for prepared highlight elements
interface PreparedHighlight {
  element: HTMLElement;
  rect: Rect;
  resultIndex: number;
  pageIndex: number;
  rectIndex: number;
}

export class SearchLayer extends BaseLayerPlugin<SearchLayerConfig, SearchLayerCacheData> {
  public zIndex = 1400;
  private search: SearchCapability;
  private scroll: ScrollCapability;
  private currentDocumentId: string = '';
  private topic: string = 'default';
  private highlightElements: Map<number, HTMLElement[]> = new Map();
  // Store prepared highlights by page index
  private preparedHighlights: Map<number, PreparedHighlight[]> = new Map();
  private activeHighlightClass = 'active-highlight';
  private normalHighlightClass = 'search-highlight';
  private currentState: SearchState = DEFAULT_STATE;
  // Track if we need to scroll to a highlight after a page loads
  private pendingScrollToResultIndex: number = -1;

  constructor(
    public readonly id: string,
    registry: PluginRegistry,
    engine: PdfEngine
  ) {
    super(id, registry, engine);
    
    // Get the search plugin
    this.search = this.registry.getPlugin<SearchPlugin>('search').provides();
    this.scroll = this.registry.getPlugin<ScrollPlugin>('scroll').provides();
  
    // Subscribe to state changes instead of individual events
    this.search.onStateChange(this.handleStateChange.bind(this));
  }

  async initialize(config: SearchLayerConfig): Promise<void> {
    // Add styles for highlight elements
    this.addSearchStyles();
  }

  /**
   * Handle search plugin state changes
   */
  private handleStateChange(state: SearchState): void {   
    if (state.active) {
      // Handle different scenarios based on state changes
      if (state.loading) {
        // Search is in progress, clear existing highlights
        this.clearAllHighlights();
        this.preparedHighlights.clear();
      }
      
      if (this.currentState.loading && state.results && state.results.length > 0) {
        // Search has results, prepare all highlights
        this.prepareHighlightsForResults(state.results);
        // Apply highlights for currently visible pages
        this.applyPreparedHighlightsForVisiblePages();

        this.updateActiveHighlight(state.activeResultIndex);
      } else if(this.currentState.activeResultIndex !== state.activeResultIndex) {
        this.updateActiveHighlight(state.activeResultIndex);
      }
    } else {
      // Search is not active, clear all highlights
      this.clearAllHighlights();
      this.preparedHighlights.clear();
    }

    this.currentState = state;
  }

  /**
   * Add necessary styles for search highlights
   */
  private addSearchStyles(): void {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .${this.normalHighlightClass} {
        position: absolute;
        background-color: rgba(255, 255, 0, 0.3);
        border-radius: 2px;
        box-sizing: border-box;
        pointer-events: none;
      }
      .${this.activeHighlightClass} {
        position: absolute;
        background-color: rgba(255, 165, 0, 0.5);
        border: 2px solid rgba(255, 140, 0, 0.8);
        border-radius: 2px;
        box-sizing: border-box;
        pointer-events: none;
      }
    `;
    document.head.appendChild(styleElement);
  }

  /**
   * Prepare highlight elements for all search results but don't add to DOM yet
   */
  private prepareHighlightsForResults(results: SearchResult[]): void {
    if (!results || results.length === 0) return;

    // Clear any existing prepared highlights
    this.preparedHighlights.clear();

    // Process each result and prepare highlight elements
    results.forEach((result: SearchResult, resultIndex: number) => {
      const pageIndex = result.pageIndex;
      const pageHighlights = this.preparedHighlights.get(pageIndex) || [];
      
      // Create highlight elements for each rect in the result
      result.rects.forEach((rect: Rect, rectIndex: number) => {
        const highlightElement = document.createElement('div');
        highlightElement.className = this.normalHighlightClass;
        
        // Set position and dimensions based on the rect
        highlightElement.style.left = `${rect.origin.x}px`;
        highlightElement.style.top = `${rect.origin.y}px`;
        highlightElement.style.width = `${rect.size.width}px`;
        highlightElement.style.height = `${rect.size.height}px`;
        
        // Store metadata about this highlight for later reference
        highlightElement.dataset.resultIndex = resultIndex.toString();
        highlightElement.dataset.pageIndex = pageIndex.toString();
        highlightElement.dataset.rectIndex = rectIndex.toString();
        
        // Add to prepared highlights
        pageHighlights.push({
          element: highlightElement,
          rect,
          resultIndex,
          pageIndex,
          rectIndex
        });
      });
      
      this.preparedHighlights.set(pageIndex, pageHighlights);
    });
  }

  /**
   * Apply prepared highlights for pages that are currently visible
   */
  private applyPreparedHighlightsForVisiblePages(): void {
    // Instead of trying to iterate through all page caches,
    // we'll simply check if we have rendered containers for each page with highlights
    for (const pageIndex of this.preparedHighlights.keys()) {
      const pageContainer = this.getPageCacheContainer(pageIndex);
      if (pageContainer) {
        // If we have a container, this page is visible so apply highlights
        this.applyPreparedHighlightsForPage(pageIndex);
      }
    }
  }

  /**
   * Apply prepared highlights for a specific page
   */
  private applyPreparedHighlightsForPage(pageIndex: number): void {
    const pageContainer = this.getPageCacheContainer(pageIndex);
    if (!pageContainer) return;
    
    const preparedForPage = this.preparedHighlights.get(pageIndex) || [];
    const pageHighlights: HTMLElement[] = [];
    
    // Apply each prepared highlight for this page
    preparedForPage.forEach(prepared => {
      const clonedElement = prepared.element.cloneNode(true) as HTMLElement;
      pageContainer.appendChild(clonedElement);
      pageHighlights.push(clonedElement);
    });
    
    // Store the applied highlight elements
    this.highlightElements.set(pageIndex, pageHighlights);
    
    // Apply active highlight styling if needed
    if (this.currentState.activeResultIndex >= 0) {
      this.applyActiveHighlightStyling(this.currentState.activeResultIndex);
      
      // If we have a pending scroll to a result on this page, handle it now
      if (this.pendingScrollToResultIndex >= 0) {
        // Check if the pending result is on this page
        const resultOnThisPage = preparedForPage.some(
          prepared => prepared.resultIndex === this.pendingScrollToResultIndex
        );
        
        if (resultOnThisPage) {
          // Find the element in the DOM and scroll to it
          for (const element of pageHighlights) {
            if (element.dataset.resultIndex === this.pendingScrollToResultIndex.toString()) {
              // We've found our element, scroll to it
              setTimeout(() => {
                // Use setTimeout to ensure the page has been fully rendered
                try {
                  element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                  });
                } catch (error) {
                  console.error('Error scrolling to highlight after page load:', error);
                }
                // Clear the pending scroll
                this.pendingScrollToResultIndex = -1;
              }, 100); // Small delay to ensure rendering is complete
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Apply styling to the active highlight without scrolling
   */
  private applyActiveHighlightStyling(activeResultIndex: number): void {
    if (activeResultIndex < 0) return;
    
    // First, reset all highlights to normal
    this.highlightElements.forEach(highlights => {
      highlights.forEach(element => {
        element.className = this.normalHighlightClass;
      });
    });
    
    // Then, find and highlight the active result (without scrolling)
    this.highlightElements.forEach(highlights => {
      highlights.forEach(element => {
        if (element.dataset.resultIndex === activeResultIndex.toString()) {
          element.className = this.activeHighlightClass;
        }
      });
    });
  }

  /**
   * Update which highlight is currently active and scroll to it
   */
  private updateActiveHighlight(activeResultIndex: number): void {
    if (activeResultIndex < 0) {
      this.pendingScrollToResultIndex = -1;
      return;
    }
    
    // Apply styling first
    this.applyActiveHighlightStyling(activeResultIndex);
    
    // Try to find the active highlight in the DOM
    let highlightFound = false;
    let pageWithResult: number | null = null;
    
    // First, find which page contains this result in our prepared highlights
    // This way we know which page to scroll to even if the highlight isn't in the DOM
    for (const [pageIndex, highlights] of this.preparedHighlights.entries()) {
      for (const prepared of highlights) {
        if (prepared.resultIndex === activeResultIndex) {
          pageWithResult = pageIndex;
          break;
        }
      }
      if (pageWithResult !== null) break;
    }
    
    // Now try to find the element in the DOM to scroll to it directly
    for (const [pageIndex, highlights] of this.highlightElements.entries()) {
      for (const element of highlights) {
        if (element.dataset.resultIndex === activeResultIndex.toString()) {
          // Check if the element is actually in the DOM (connected to the document)
          // This handles virtual scrolling where elements might be removed
          if (element.isConnected) {
            // We've found our active element AND it's in the DOM, scroll to it
            try {
              // Using try/catch to handle any potential scrolling issues
              element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              highlightFound = true;
            } catch (error) {
              console.error('Error scrolling to highlight:', error);
            }
            // No need to continue searching
            break;
          }
        }
      }
      if (highlightFound) break;
    }
    
    // If highlight wasn't found in the DOM or wasn't connected, 
    // we need to scroll to the right page first
    if (!highlightFound && pageWithResult !== null) {
      console.log(`Scrolling to page ${pageWithResult} for result ${activeResultIndex}`);
      // Set the pending result to scroll to once the page is loaded
      this.pendingScrollToResultIndex = activeResultIndex;
      // Scroll to the page containing the result
      this.scroll.scrollToPage(pageWithResult + 1); // +1 because UI pages are 1-indexed
    } else if (highlightFound) {
      // We found and scrolled to the highlight, clear any pending scroll
      this.pendingScrollToResultIndex = -1;
    }
  }

  /**
   * Clear all search highlights
   */
  private clearAllHighlights(): void {
    this.highlightElements.forEach((elements, pageIndex) => {
      elements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    });
    this.highlightElements.clear();
  }

  /**
   * Get the container for a specific page from the page cache
   */
  private getPageCacheContainer(pageIndex: number): HTMLElement | null {
    const pageCache = this.getPageCache(this.currentDocumentId, pageIndex, this.topic);
    if (!pageCache) return null;
    return pageCache.container;
  }

  async render(pdfDocument: PdfDocumentObject, page: PdfPageObject, container: HTMLElement, options: LayerRenderOptions): Promise<void> {
    // Store document ID for later reference
    this.currentDocumentId = pdfDocument.id;
    this.topic = options.topic || 'default';
    
    // Store the container in the page cache for later access
    this.setPageCache(
      pdfDocument.id,
      page.index,
      page,
      container,
      options,
      { container }
    );
    
    // If search is active and we have prepared highlights for this page, apply them
    if (this.currentState.active && this.preparedHighlights.has(page.index)) {
      // Clear any existing highlights on this page
      const existingHighlights = this.highlightElements.get(page.index) || [];
      existingHighlights.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
      
      // Apply prepared highlights for this specific page
      this.applyPreparedHighlightsForPage(page.index);
    }
  }

  async destroy(): Promise<void> {
    // Clean up all highlights
    this.clearAllHighlights();
    this.preparedHighlights.clear();
  }
}