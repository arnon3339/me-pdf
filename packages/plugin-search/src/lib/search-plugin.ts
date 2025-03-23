import { BasePlugin, PluginRegistry } from "@embedpdf/core";
import {
  MatchFlag,
  PdfDocumentObject,
  SearchAllPagesResult,
  TaskError,
  PdfEngine,
} from "@embedpdf/models";
import { SearchPluginConfig, SearchCapability, SearchState } from "./types";
import { LoaderCapability, LoaderEvent, LoaderPlugin } from "@embedpdf/plugin-loader";
import {
  startSearchSession,
  stopSearchSession,
  setSearchFlags,
  setShowAllResults,
  startSearch,
  setSearchResults,
  setActiveResultIndex,
  SearchAction,
} from "./actions";

export class SearchPlugin extends BasePlugin<SearchPluginConfig, SearchState, SearchAction> {
  private loader: LoaderCapability;
  private currentDocument?: PdfDocumentObject;
  private engine: PdfEngine;
  private searchHandlers: ((searchResult: SearchAllPagesResult) => void)[] = [];
  private searchStartHandlers: (() => void)[] = [];
  private searchStopHandlers: (() => void)[] = [];
  private activeResultChangeHandlers: ((index: number) => void)[] = [];

  constructor(id: string, registry: PluginRegistry, engine: PdfEngine) {
    super(id, registry);
    this.engine = engine;
    this.loader = this.registry.getPlugin<LoaderPlugin>("loader").provides();

    this.loader.onDocumentLoaded(this.handleDocumentLoaded.bind(this));
    this.loader.onLoaderEvent(this.handleLoaderEvent.bind(this));
  }

  private handleDocumentLoaded(doc: PdfDocumentObject): void {
    this.currentDocument = doc;
    if (this.getState().active) {
      this.startSearchSession();
    }
  }

  private handleLoaderEvent(event: LoaderEvent): void {
    if (event.type === "error" || (event.type === "start" && this.currentDocument)) {
      if (this.getState().active) {
        this.stopSearchSession();
      }
      this.currentDocument = undefined;
    }
  }

  async initialize(config: SearchPluginConfig): Promise<void> {
    this.dispatch(setSearchFlags(config.flags || []));
    this.dispatch(
      setShowAllResults(config.showAllResults !== undefined ? config.showAllResults : true)
    );
  }

  provides(): SearchCapability {
    return {
      startSearch: this.startSearchSession.bind(this),
      stopSearch: this.stopSearchSession.bind(this),
      searchAllPages: this.searchAllPages.bind(this),
      nextResult: this.nextResult.bind(this),
      previousResult: this.previousResult.bind(this),
      goToResult: this.goToResult.bind(this),
      setShowAllResults: (showAll) => this.dispatch(setShowAllResults(showAll)),
      getShowAllResults: () => this.getState().showAllResults,
      onSearchResult: this.addSearchResultHandler.bind(this),
      onSearchStart: this.addSearchStartHandler.bind(this),
      onSearchStop: this.addSearchStopHandler.bind(this),
      onActiveResultChange: this.addActiveResultChangeHandler.bind(this),
      onStateChange: (handler) => {
        const unsubscribe = this.subscribe((_, state) => handler(state));
        return unsubscribe;
      },
      getFlags: () => this.getState().flags,
      setFlags: (flags) => this.dispatch(setSearchFlags(flags)),
    };
  }

  private addSearchResultHandler(
    handler: (result: SearchAllPagesResult) => void
  ): () => void {
    this.searchHandlers.push(handler);
    return () => {
      this.searchHandlers = this.searchHandlers.filter((h) => h !== handler);
    };
  }

  private addSearchStartHandler(handler: () => void): () => void {
    this.searchStartHandlers.push(handler);
    return () => {
      this.searchStartHandlers = this.searchStartHandlers.filter((h) => h !== handler);
    };
  }

  private addSearchStopHandler(handler: () => void): () => void {
    this.searchStopHandlers.push(handler);
    return () => {
      this.searchStopHandlers = this.searchStopHandlers.filter((h) => h !== handler);
    };
  }

  private addActiveResultChangeHandler(handler: (index: number) => void): () => void {
    this.activeResultChangeHandlers.push(handler);
    return () => {
      this.activeResultChangeHandlers = this.activeResultChangeHandlers.filter(
        (h) => h !== handler
      );
    };
  }

  private notifySearchStart(): void {
    this.searchStartHandlers.forEach((handler) => handler());
  }

  private notifySearchStop(): void {
    this.searchStopHandlers.forEach((handler) => handler());
  }

  private notifyActiveResultChange(index: number): void {
    this.activeResultChangeHandlers.forEach((handler) => handler(index));
  }

  private startSearchSession(): void {
    if (!this.currentDocument) {
      return;
    }
    this.dispatch(startSearchSession());
    this.notifySearchStart();
  }

  private stopSearchSession(): void {
    if (!this.currentDocument || !this.getState().active) {
      return;
    }
    this.dispatch(stopSearchSession());
    this.notifySearchStop();
  }

  private async searchAllPages(keyword: string): Promise<SearchAllPagesResult> {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      console.warn("Empty search keyword is not allowed");
      return { results: [], total: 0 };
    }
    if (!this.currentDocument) {
      return { results: [], total: 0 };
    }

    const state = this.getState();
    if (!state.active) {
      this.startSearchSession();
    }
    if (state.query === trimmedKeyword) {
      return { results: state.results, total: state.total };
    }

    this.dispatch(startSearch(trimmedKeyword));
    return new Promise<SearchAllPagesResult>((resolve) => {
      this.engine
        .searchAllPages(this.currentDocument!, trimmedKeyword, state.flags)
        .wait(
          (results) => {
            const activeResultIndex = results.total > 0 ? 0 : -1;
            this.dispatch(setSearchResults(results.results, results.total, activeResultIndex));
            this.searchHandlers.forEach((handler) => handler(results));
            if (results.total > 0) {
              this.notifyActiveResultChange(0);
            }
            resolve(results);
          },
          (error: TaskError<any>) => {
            console.error("Error during search:", error);
            this.dispatch(setSearchResults([], 0, -1));
            resolve({ results: [], total: 0 });
          }
        );
    });
  }

  private nextResult(): number {
    const state = this.getState();
    if (state.results.length === 0) {
      return -1;
    }
    const nextIndex =
      state.activeResultIndex >= state.results.length - 1
        ? 0
        : state.activeResultIndex + 1;
    return this.goToResult(nextIndex);
  }

  private previousResult(): number {
    const state = this.getState();
    if (state.results.length === 0) {
      return -1;
    }
    const prevIndex =
      state.activeResultIndex <= 0
        ? state.results.length - 1
        : state.activeResultIndex - 1;
    return this.goToResult(prevIndex);
  }

  private goToResult(index: number): number {
    const state = this.getState();
    if (state.results.length === 0 || index < 0 || index >= state.results.length) {
      return -1;
    }
    this.dispatch(setActiveResultIndex(index));
    this.notifyActiveResultChange(index);
    return index;
  }

  async destroy(): Promise<void> {
    if (this.getState().active && this.currentDocument) {
      this.stopSearchSession();
    }
    this.searchHandlers = [];
    this.searchStartHandlers = [];
    this.searchStopHandlers = [];
    this.activeResultChangeHandlers = [];
  }
}