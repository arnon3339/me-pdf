import { BaseLayerPlugin, LayerRenderOptions } from "@embedpdf/plugin-layer";
import { SearchLayerConfig } from "./types";
import { PluginRegistry } from "@embedpdf/core";
import { PdfDocumentObject, PdfEngine, PdfPageObject, Rect, SearchResult } from "@embedpdf/models";
import { SearchPlugin, SearchCapability, SearchState, DEFAULT_STATE } from "@embedpdf/plugin-search";

// Define cache data type for the search layer
interface SearchLayerCacheData {
  container: HTMLElement;
}

export class SearchLayer extends BaseLayerPlugin<SearchLayerConfig, SearchLayerCacheData> {
  public zIndex = 1400;
  private search: SearchCapability;
  private currentDocumentId: string = '';
  private topic: string = 'default';
  private highlightElements: Map<number, HTMLElement[]> = new Map();
  private activeHighlightClass = 'active-highlight';
  private normalHighlightClass = 'search-highlight';
  private currentState: SearchState = DEFAULT_STATE;

  constructor(
    public readonly id: string,
    registry: PluginRegistry,
    engine: PdfEngine
  ) {
    super(id, registry, engine);
    
    // Get the search plugin
    this.search = this.registry.getPlugin<SearchPlugin>('search').provides();
    
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
    console.log(this.highlightElements) 
    if (state.active) {
      // Handle different scenarios based on state changes
      if (state.loading) {
        // Search is in progress, clear existing highlights
        this.clearAllHighlights();
      }
      
      if (this.currentState.loading && state.results && state.results.length > 0) {
        // Search has results, render highlights
        this.renderHighlightsForResults(state.results);
      }

      if(this.currentState.activeResultIndex !== state.activeResultIndex) {
        this.updateActiveHighlight(state.activeResultIndex);
      }
    } else {
      // Search is not active, clear all highlights
      this.clearAllHighlights();
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
   * Render highlights for search results
   */
  private renderHighlightsForResults(results: SearchResult[]): void {
    if (!results || results.length === 0) return;

    // Process each result
    results.forEach((result: SearchResult, resultIndex: number) => {
      const pageIndex = result.pageIndex;
      const pageHighlights = this.highlightElements.get(pageIndex) || [];
      
      // Get the container for this page
      const pageContainer = this.getPageCacheContainer(pageIndex);
      if (!pageContainer) return;
      
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
        
        pageContainer.appendChild(highlightElement);
        pageHighlights.push(highlightElement);
      });
      
      this.highlightElements.set(pageIndex, pageHighlights);
    });
  }

  /**
   * Update which highlight is currently active
   */
  private updateActiveHighlight(activeResultIndex: number): void {
    if (activeResultIndex < 0) return;
    
    // First, reset all highlights to normal
    this.highlightElements.forEach(highlights => {
      highlights.forEach(element => {
        element.className = this.normalHighlightClass;
      });
    });
    
    // Then, find and highlight the active result
    this.highlightElements.forEach(highlights => {
      highlights.forEach(element => {
        if (element.dataset.resultIndex === activeResultIndex.toString()) {
          element.className = this.activeHighlightClass;
          
          // Scroll the element into view
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      });
    });
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
    
    // If search is active and we have results, render highlights for this page
    if (this.currentState.active && this.currentState.results?.length > 0) {
      // Find results for this specific page
      const pageResults = this.currentState.results.filter((r: SearchResult) => r.pageIndex === page.index);
      
      if (pageResults.length > 0) {
        // Clear any existing highlights on this page
        const existingHighlights = this.highlightElements.get(page.index) || [];
        existingHighlights.forEach(el => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
        
        // Render highlights just for this page
        this.renderHighlightsForResults(pageResults);
        
        // Update active highlight if needed
        if (this.currentState.activeResultIndex >= 0) {
          //this.updateActiveHighlight(this.currentState.activeResultIndex);
        }
      }
    }
  }

  async destroy(): Promise<void> {
    // Clean up all highlights
    this.clearAllHighlights();
  }
}