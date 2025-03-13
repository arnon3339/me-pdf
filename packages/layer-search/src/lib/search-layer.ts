import { BaseLayerPlugin, LayerRenderOptions } from "@embedpdf/plugin-layer";
import { SearchLayerConfig } from "./types";
import { PluginRegistry } from "@embedpdf/core";
import { PdfDocumentObject, PdfEngine, PdfPageObject, Rect, SearchResult } from "@embedpdf/models";
import { SearchPlugin, SearchCapability, SearchState, DEFAULT_STATE } from "@embedpdf/plugin-search";
import { ScrollPlugin, ScrollCapability } from "@embedpdf/plugin-scroll";

// Cache data for each page
interface SearchLayerCacheData {
  container: HTMLElement;
}

// Structure for prepared highlight elements
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
  private currentDocumentId: string = "";
  private topic: string = "default";
  private currentState: SearchState = DEFAULT_STATE;

  // Maps for managing highlights
  private preparedHighlights: Map<number, PreparedHighlight[]> = new Map(); // Prepared but not in DOM
  private highlightElements: Map<number, HTMLElement[]> = new Map(); // Applied to DOM

  // CSS class names as constants
  private readonly NORMAL_HIGHLIGHT_CLASS = "search-highlight";
  private readonly ACTIVE_HIGHLIGHT_CLASS = "active-highlight";

  // Tracks pending scroll to a result when its page isn’t loaded yet
  private pendingScrollToResultIndex: number = -1;

  constructor(id: string, registry: PluginRegistry, engine: PdfEngine) {
    super(id, registry, engine);

    this.search = this.registry.getPlugin<SearchPlugin>("search").provides();
    this.scroll = this.registry.getPlugin<ScrollPlugin>("scroll").provides();

    // Bind to search state changes
    this.search.onStateChange(this.handleStateChange.bind(this));
  }

  /** Initialize the layer by adding highlight styles */
  async initialize(config: SearchLayerConfig): Promise<void> {
    this.addSearchStyles();
  }

  /** Handle changes in search state */
  private handleStateChange(state: SearchState): void {
    if (state.active) {
      if (state.loading) {
        // Clear highlights when search starts
        this.clearAllHighlights();
        this.preparedHighlights.clear();
      } else if (this.currentState.loading && state.results && state.results.length > 0) {
        // Search completed with results
        this.prepareHighlightsForResults(state.results);
        this.applyPreparedHighlightsForVisiblePages();
        this.updateActiveHighlight(state.activeResultIndex);
      } else if (this.currentState.activeResultIndex !== state.activeResultIndex) { 
        this.updateActiveHighlight(state.activeResultIndex);
      } else {
        // Active but no results (e.g., empty search)
        this.clearAllHighlights();
        this.preparedHighlights.clear();
      }
    } else {
      // Search deactivated
      this.clearAllHighlights();
      this.preparedHighlights.clear();
    }

    this.currentState = state; // Update current state for reference
  }

  /** Inject CSS styles for highlights */
  private addSearchStyles(): void {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .${this.NORMAL_HIGHLIGHT_CLASS} {
        position: absolute;
        background-color: rgba(255, 255, 0, 0.3);
        border-radius: 2px;
        box-sizing: border-box;
        pointer-events: none;
      }
      .${this.ACTIVE_HIGHLIGHT_CLASS} {
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

  /** Prepare highlight elements for all search results */
  private prepareHighlightsForResults(results: SearchResult[]): void {
    if (!results?.length) return;

    this.preparedHighlights.clear();

    results.forEach((result, resultIndex) => {
      const pageIndex = result.pageIndex;
      const preparedForPage = this.preparedHighlights.get(pageIndex) || [];

      result.rects.forEach((rect, rectIndex) => {
        const element = document.createElement("div");
        element.className = this.NORMAL_HIGHLIGHT_CLASS;
        element.style.left = `round(down, var(--scale-factor) * ${rect.origin.x}px, 1px)`;
        element.style.top = `round(down, var(--scale-factor) * ${rect.origin.y}px, 1px)`;
        element.style.width = `round(down, var(--scale-factor) * ${rect.size.width}px, 1px)`;
        element.style.height = `round(down, var(--scale-factor) * ${rect.size.height}px, 1px)`;
        element.dataset.resultIndex = resultIndex.toString();
        element.dataset.pageIndex = pageIndex.toString();
        element.dataset.rectIndex = rectIndex.toString();

        preparedForPage.push({ element, rect, resultIndex, pageIndex, rectIndex });
      });

      this.preparedHighlights.set(pageIndex, preparedForPage);
    });
  }

  /** Apply highlights to all currently visible pages */
  private applyPreparedHighlightsForVisiblePages(): void {
    for (const pageIndex of this.preparedHighlights.keys()) {
      if (this.getPageCacheContainer(pageIndex)) {
        this.applyPreparedHighlightsForPage(pageIndex);
      }
    }
  }

  /** Apply highlights to a specific page */
  private applyPreparedHighlightsForPage(pageIndex: number): void {
    const container = this.getPageCacheContainer(pageIndex);
    if (!container) return;

    const preparedForPage = this.preparedHighlights.get(pageIndex) || [];
    const appliedHighlights: HTMLElement[] = [];

    preparedForPage.forEach((prepared) => {
      const clonedElement = prepared.element.cloneNode(true) as HTMLElement;
      container.appendChild(clonedElement);
      appliedHighlights.push(clonedElement);
    });

    this.highlightElements.set(pageIndex, appliedHighlights);

    // Apply active styling if there’s an active result
    if (this.currentState.activeResultIndex >= 0) {
      this.applyActiveHighlightStyling(this.currentState.activeResultIndex);
    }

    // Handle pending scroll if applicable
    if (this.pendingScrollToResultIndex >= 0) {
      const highlights = this.highlightElements.get(pageIndex) || [];
      for (const element of highlights) {
        if (element.dataset.resultIndex === this.pendingScrollToResultIndex.toString()) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            this.pendingScrollToResultIndex = -1;
          }, 100); // Delay to ensure rendering
          break;
        }
      }
    }
  }

  /** Style the active highlight */
  private applyActiveHighlightStyling(activeResultIndex: number): void {
    if (activeResultIndex < 0) return;

    this.highlightElements.forEach((highlights) => {
      highlights.forEach((element) => {
        element.className =
          element.dataset.resultIndex === activeResultIndex.toString()
            ? this.ACTIVE_HIGHLIGHT_CLASS
            : this.NORMAL_HIGHLIGHT_CLASS;
      });
    });
  }

  /** Update the active highlight and scroll to it */
  private updateActiveHighlight(activeResultIndex: number): void {
    if (activeResultIndex < 0) {
      this.pendingScrollToResultIndex = -1;
      return;
    }

    this.applyActiveHighlightStyling(activeResultIndex);
    this.scrollToResult(activeResultIndex);
  }

  /** Scroll to a specific search result */
  private scrollToResult(resultIndex: number): void {
    // Check if the highlight is already in the DOM
    for (const [pageIndex, highlights] of this.highlightElements) {
      for (const element of highlights) {
        if (
          element.dataset.resultIndex === resultIndex.toString() &&
          element.isConnected
        ) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          this.pendingScrollToResultIndex = -1;
          return;
        }
      }
    }

    // If not in DOM, scroll to the page and set pending scroll
    for (const [pageIndex, prepared] of this.preparedHighlights) {
      if (prepared.some((p) => p.resultIndex === resultIndex)) {
        this.scroll.scrollToPage(pageIndex + 1); // 1-indexed pages
        this.pendingScrollToResultIndex = resultIndex;
        return;
      }
    }
  }

  /** Remove all highlights from the DOM */
  private clearAllHighlights(): void {
    this.highlightElements.forEach((elements) => {
      elements.forEach((element) => element.parentNode?.removeChild(element));
    });
    this.highlightElements.clear();
  }

  /** Retrieve the container for a page from cache */
  private getPageCacheContainer(pageIndex: number): HTMLElement | null {
    return this.getPageCache(this.currentDocumentId, pageIndex, this.topic)?.container || null;
  }

  /** Render the layer for a page */
  async render(
    pdfDocument: PdfDocumentObject,
    page: PdfPageObject,
    container: HTMLElement,
    options: LayerRenderOptions
  ): Promise<void> {
    this.currentDocumentId = pdfDocument.id;
    this.topic = options.topic || "default";

    const inCache = this.getPageCache(pdfDocument.id, page.index, this.topic);
    
    if (inCache) {
      return;
    }

    this.setPageCache(pdfDocument.id, page.index, page, container, options, { container });

    if (this.currentState.active && this.preparedHighlights.has(page.index)) {
      this.applyPreparedHighlightsForPage(page.index);
    }
  }

  /** Clean up on destruction */
  async destroy(): Promise<void> {
    this.clearAllHighlights();
    this.preparedHighlights.clear();
  }
}