import { BasePlugin, PluginRegistry } from "@embedpdf/core";
import { 
  MatchFlag, 
  PdfDocumentObject, 
  SearchResult, 
  SearchTarget,
  TaskError,
  PdfEngine
} from "@embedpdf/models";
import { SearchPluginConfig, SearchCapability, SearchState } from "./types";
import { LoaderCapability, LoaderEvent, LoaderPlugin } from "@embedpdf/plugin-loader";

/**
 * Plugin that provides PDF search functionality
 */
export class SearchPlugin extends BasePlugin<SearchPluginConfig, SearchState> {
  private loader: LoaderCapability;
  private currentDocument?: PdfDocumentObject;
  private engine: PdfEngine;
  private searchContextId: number; 
  private activeSearch: boolean = false;
  private searchHandlers: ((searchResult: SearchResult) => void)[] = [];
  private searchStartHandlers: (() => void)[] = [];
  private searchStopHandlers: (() => void)[] = [];

  constructor(
    public readonly id: string,
    registry: PluginRegistry,
    engine: PdfEngine,
  ) {
    super(id, registry, {
      flags: []
    });

    this.engine = engine;
    this.loader = this.registry.getPlugin<LoaderPlugin>('loader').provides();
    this.searchContextId = Date.now(); // Create a unique context ID

    // Handle document lifecycle events
    this.loader.onDocumentLoaded(this.handleDocumentLoaded.bind(this));
    this.loader.onLoaderEvent(this.handleLoaderEvent.bind(this));
  }

  /**
   * Handle document loaded event
   * @param doc - The loaded document
   */
  private handleDocumentLoaded(doc: PdfDocumentObject): void {
    this.currentDocument = doc;
    if (this.activeSearch) {
      // Restart search session on new document
      this.startSearchSession();
    }
  }

  private handleLoaderEvent(event: LoaderEvent): void {
    // Handle document closing
    if (event.type === 'error' || (event.type === 'start' && this.currentDocument)) {
      if (this.activeSearch) {
        this.stopSearchSession();
      }
      this.currentDocument = undefined;
    }
  }

  /**
   * Initialize the search plugin with the provided configuration
   */
  async initialize(config: SearchPluginConfig): Promise<void> {
    this.updateState({
      flags: config.flags || []
    });
  }

  /**
   * Return the search capabilities provided by this plugin
   */
  provides(): SearchCapability {
    return {
      startSearch: this.startSearchSession.bind(this),
      stopSearch: this.stopSearchSession.bind(this),
      searchNext: this.searchNext.bind(this),
      searchPrev: this.searchPrev.bind(this),
      onSearchResult: this.addSearchResultHandler.bind(this),
      onSearchStart: this.addSearchStartHandler.bind(this),
      onSearchStop: this.addSearchStopHandler.bind(this),
      getFlags: this.getFlags.bind(this),
      setFlags: this.setFlags.bind(this)
    };
  }

  /**
   * Add a search result handler
   * @param handler - Function to call when search result is found
   * @returns Function to remove the handler
   */
  private addSearchResultHandler(handler: (result: SearchResult) => void): () => void {
    this.searchHandlers.push(handler);
    return () => {
      this.searchHandlers = this.searchHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Add a search start handler
   * @param handler - Function to call when search session starts
   * @returns Function to remove the handler
   */
  private addSearchStartHandler(handler: () => void): () => void {
    this.searchStartHandlers.push(handler);
    return () => {
      this.searchStartHandlers = this.searchStartHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Add a search stop handler
   * @param handler - Function to call when search session stops
   * @returns Function to remove the handler
   */
  private addSearchStopHandler(handler: () => void): () => void {
    this.searchStopHandlers.push(handler);
    return () => {
      this.searchStopHandlers = this.searchStopHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Notify all search start handlers
   */
  private notifySearchStart(): void {
    this.searchStartHandlers.forEach(handler => handler());
  }

  /**
   * Notify all search stop handlers
   */
  private notifySearchStop(): void {
    this.searchStopHandlers.forEach(handler => handler());
  }

  /**
   * Get current search flags
   */
  private getFlags(): MatchFlag[] {
    return [...this.state.flags];
  }

  /**
   * Set search flags
   */
  private setFlags(flags: MatchFlag[]): void {
    this.updateState({
      flags: [...flags]
    });
  }

  /**
   * Start a search session
   */
  private startSearchSession(): void {
    if (!this.currentDocument) {
      return;
    }
    
    this.activeSearch = true;
    this.engine.startSearch(this.currentDocument, this.searchContextId);
    
    // Notify handlers that search has started
    this.notifySearchStart();
  }

  /**
   * Stop the current search session
   */
  private stopSearchSession(): void {
    if (!this.currentDocument || !this.activeSearch) {
      return;
    }
    
    this.engine.stopSearch(this.currentDocument, this.searchContextId);
    this.activeSearch = false;
    
    // Notify handlers that search has stopped
    this.notifySearchStop();
  }

  /**
   * Create a search target using the keyword and current flags
   */
  private createSearchTarget(keyword: string): SearchTarget {
    return {
      keyword,
      flags: this.state.flags
    };
  }

  /**
   * Search for the next occurrence of the keyword
   */
  private async searchNext(keyword: string): Promise<SearchResult | undefined> {
    if (!this.currentDocument || !this.activeSearch) {
      if (!this.activeSearch && this.currentDocument) {
        // Start search if not active yet
        this.startSearchSession();
      } else {
        return Promise.resolve(undefined);
      }
    }
    
    return new Promise<SearchResult | undefined>((resolve, reject) => {
      const target = this.createSearchTarget(keyword);
      
      this.engine.searchNext(
        this.currentDocument!, 
        this.searchContextId, 
        target
      ).wait(
        (result) => {
          if (result) {
            // Notify search handlers about the result
            this.searchHandlers.forEach(handler => handler(result));
          }
          resolve(result);
        },
        (error: TaskError<any>) => {
          console.error('Error during search:', error);
          resolve(undefined);
        }
      );
    });
  }

  /**
   * Search for the previous occurrence of the keyword
   */
  private async searchPrev(keyword: string): Promise<SearchResult | undefined> {
    if (!this.currentDocument || !this.activeSearch) {
      if (!this.activeSearch && this.currentDocument) {
        // Start search if not active yet
        this.startSearchSession();
      } else {
        return Promise.resolve(undefined);
      }
    }
    
    return new Promise<SearchResult | undefined>((resolve, reject) => {
      const target = this.createSearchTarget(keyword);
      
      this.engine.searchPrev(
        this.currentDocument!, 
        this.searchContextId, 
        target
      ).wait(
        (result) => {
          if (result) {
            // Notify search handlers about the result
            this.searchHandlers.forEach(handler => handler(result));
          }
          resolve(result);
        },
        (error: TaskError<any>) => {
          console.error('Error during search:', error);
          resolve(undefined);
        }
      );
    });
  }

  /**
   * Clean up resources when plugin is destroyed
   */
  async destroy(): Promise<void> {
    // Clean up search session
    if (this.currentDocument && this.activeSearch) {
      this.stopSearchSession();
    }
    this.searchHandlers = [];
    this.searchStartHandlers = [];
    this.searchStopHandlers = [];
    this.currentDocument = undefined;
    
    // Call parent's destroy method
    await super.destroy();
  }
}