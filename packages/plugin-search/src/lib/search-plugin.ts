import { BasePlugin, PluginRegistry } from "@embedpdf/core";
import { 
  MatchFlag, 
  PdfDocumentObject, 
  SearchAllPagesResult,
  TaskError,
  PdfEngine
} from "@embedpdf/models";
import { SearchPluginConfig, SearchCapability, SearchState } from "./types";
import { LoaderCapability, LoaderEvent, LoaderPlugin } from "@embedpdf/plugin-loader";

export const DEFAULT_STATE: SearchState = {
  flags: [],
  results: [],
  total: 0,
  activeResultIndex: -1,
  showAllResults: true,
  query: '',
  loading: false,
  active: false
}

/**
 * Plugin that provides PDF search functionality
 */
export class SearchPlugin extends BasePlugin<SearchPluginConfig, SearchState> {
  private loader: LoaderCapability;
  private currentDocument?: PdfDocumentObject;
  private engine: PdfEngine;
  private searchHandlers: ((searchResult: SearchAllPagesResult) => void)[] = [];
  private searchStartHandlers: (() => void)[] = [];
  private searchStopHandlers: (() => void)[] = [];
  private activeResultChangeHandlers: ((index: number) => void)[] = [];

  constructor(
    public readonly id: string,
    registry: PluginRegistry,
    engine: PdfEngine,
  ) {
    super(id, registry, DEFAULT_STATE);

    this.engine = engine;
    this.loader = this.registry.getPlugin<LoaderPlugin>('loader').provides();

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
    if (this.state.active) {
      // Restart search session on new document
      this.startSearchSession();
    }
  }

  private handleLoaderEvent(event: LoaderEvent): void {
    // Handle document closing
    if (event.type === 'error' || (event.type === 'start' && this.currentDocument)) {
      if (this.state.active) {
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
      flags: config.flags || [],
      showAllResults: config.showAllResults !== undefined ? config.showAllResults : true
    });
  }

  /**
   * Return the search capabilities provided by this plugin
   */
  provides(): SearchCapability {
    return {
      startSearch: this.startSearchSession.bind(this),
      stopSearch: this.stopSearchSession.bind(this),
      searchAllPages: this.searchAllPages.bind(this),
      nextResult: this.nextResult.bind(this),
      previousResult: this.previousResult.bind(this),
      goToResult: this.goToResult.bind(this),
      setShowAllResults: this.setShowAllResults.bind(this),
      getShowAllResults: this.getShowAllResults.bind(this),
      onSearchResult: this.addSearchResultHandler.bind(this),
      onSearchStart: this.addSearchStartHandler.bind(this),
      onSearchStop: this.addSearchStopHandler.bind(this),
      onActiveResultChange: this.addActiveResultChangeHandler.bind(this),
      onStateChange: this.onStateChange.bind(this),
      getFlags: this.getFlags.bind(this),
      setFlags: this.setFlags.bind(this)
    };
  }

  /**
   * Add a search result handler
   * @param handler - Function to call when search result is found
   * @returns Function to remove the handler
   */
  private addSearchResultHandler(handler: (result: SearchAllPagesResult) => void): () => void {
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
   * Add a handler for active result changes
   * @param handler - Function to call when active result changes
   * @returns Function to remove the handler
   */
  private addActiveResultChangeHandler(handler: (index: number) => void): () => void {
    this.activeResultChangeHandlers.push(handler);
    return () => {
      this.activeResultChangeHandlers = this.activeResultChangeHandlers.filter(h => h !== handler);
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
   * Notify all active result change handlers
   * @param index - The new active result index
   */
  private notifyActiveResultChange(index: number): void {
    this.activeResultChangeHandlers.forEach(handler => handler(index));
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
   * Navigate to the next search result
   * @returns The new active result index
   */
  private nextResult(): number {
    if (this.state.results.length === 0) {
      return -1;
    }

    const nextIndex = this.state.activeResultIndex >= this.state.results.length - 1
      ? 0  // Wrap around to the first result
      : this.state.activeResultIndex + 1;
    
    return this.goToResult(nextIndex);
  }

  /**
   * Navigate to the previous search result
   * @returns The new active result index
   */
  private previousResult(): number {
    if (this.state.results.length === 0) {
      return -1;
    }

    const prevIndex = this.state.activeResultIndex <= 0
      ? this.state.results.length - 1  // Wrap around to the last result
      : this.state.activeResultIndex - 1;
    
    return this.goToResult(prevIndex);
  }

  /**
   * Go to a specific search result by index
   * @param index - The index of the result to navigate to
   * @returns The new active result index
   */
  private goToResult(index: number): number {
    if (this.state.results.length === 0 || index < 0 || index >= this.state.results.length) {
      return -1;
    }

    this.updateState({
      activeResultIndex: index
    });

    // Notify handlers of active result change
    this.notifyActiveResultChange(index);
    
    return index;
  }

  /**
   * Set whether to show all search results or only the active one
   * @param showAll - Whether to show all search results
   */
  private setShowAllResults(showAll: boolean): void {
    this.updateState({
      showAllResults: showAll
    });
  }

  /**
   * Get the current setting for showing all results
   * @returns Whether all results are visible
   */
  private getShowAllResults(): boolean {
    return this.state.showAllResults;
  }

  /**
   * Start a search session
   */
  private startSearchSession(): void {
    if (!this.currentDocument) {
      return;
    }
    
    this.updateState({
      active: true
    });
    
    // Notify handlers that search has started
    this.notifySearchStart();
  }

  /**
   * Stop the current search session
   */
  private stopSearchSession(): void {
    if (!this.currentDocument || !this.state.active) {
      return;
    }
    
    // Clear search results and reset state
    this.updateState({
      results: [],
      total: 0,
      activeResultIndex: -1,
      query: '',
      loading: false,
      active: false
    });
    
    // Notify handlers that search has stopped
    this.notifySearchStop();
  }

  /**
   * Search for all occurrences of the keyword throughout the document
   * @param keyword Text to search for
   * @returns Promise resolving to all search results
   */
  private async searchAllPages(keyword: string): Promise<SearchAllPagesResult> {
    const trimmedKeyword = keyword.trim();
    // Validate that keyword is not empty
    if (!trimmedKeyword || trimmedKeyword === '') {
      console.warn('Empty search keyword is not allowed');
      return Promise.resolve({ results: [], total: 0 });
    }

    if (!this.currentDocument) {
      return Promise.resolve({ results: [], total: 0 });
    }
    
    if (!this.state.active) {
      // Start search session if not active
      this.startSearchSession();
    }

    if(this.state.query === trimmedKeyword) {
      return Promise.resolve({ results: this.state.results, total: this.state.total });
    }

    // Update state to indicate loading and set query
    this.updateState({
      loading: true,
      query: trimmedKeyword
    });
    
    return new Promise<SearchAllPagesResult>((resolve, reject) => {
      this.engine.searchAllPages(
        this.currentDocument!,
        trimmedKeyword,
        this.state.flags
      ).wait(
        (results) => {
          // Update state with search results
          this.updateState({
            results: results.results,
            total: results.total,
            loading: false,
            activeResultIndex: results.total > 0 ? 0 : -1 // Select first result if available
          });
          
          // Notify handlers of all search results
          this.searchHandlers.forEach(handler => handler(results));
          
          // Notify about active result if we have results
          if (results.total > 0) {
            this.notifyActiveResultChange(0);
          }
          
          resolve(results);
        },
        (error: TaskError<any>) => {
          console.error('Error during search:', error);
          
          // Update state to indicate search is no longer loading
          this.updateState({
            loading: false
          });
          
          resolve({ results: [], total: 0 });
        }
      );
    });
  }

  /**
   * Clean up resources when plugin is destroyed
   */
  async destroy(): Promise<void> {
    if (this.state.active && this.currentDocument) {
      this.stopSearchSession();
    }
    
    this.searchHandlers = [];
    this.searchStartHandlers = [];
    this.searchStopHandlers = [];
    this.activeResultChangeHandlers = [];
  }
}