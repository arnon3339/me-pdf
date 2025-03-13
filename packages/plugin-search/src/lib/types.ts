import { BasePluginConfig } from "@embedpdf/core";
import { MatchFlag, SearchResult, SearchTarget } from "@embedpdf/models";

export interface SearchPluginConfig extends BasePluginConfig {
  flags?: MatchFlag[];
}

export interface SearchState {
  flags: MatchFlag[];
}

export interface SearchCapability {
  /**
   * Start a search session
   */
  startSearch: () => void;
  
  /**
   * Stop the active search session
   */
  stopSearch: () => void;
  
  /**
   * Search for the next occurrence of the keyword
   * @param keyword - Text to search for
   * @returns Promise that resolves to search result or undefined if no result found
   */
  searchNext: (keyword: string) => Promise<SearchResult | undefined>;
  
  /**
   * Search for the previous occurrence of the keyword
   * @param keyword - Text to search for
   * @returns Promise that resolves to search result or undefined if no result found
   */
  searchPrev: (keyword: string) => Promise<SearchResult | undefined>;

  /**
   * Subscribe to search results
   * @param handler - Handler function to receive search results
   * @returns Function to unsubscribe the handler
   */
  onSearchResult: (handler: (searchResult: SearchResult) => void) => () => void;

  /**
   * Subscribe to search session start events
   * @param handler - Handler function called when search session starts
   * @returns Function to unsubscribe the handler
   */
  onSearchStart: (handler: () => void) => () => void;

  /**
   * Subscribe to search session stop events
   * @param handler - Handler function called when search session stops
   * @returns Function to unsubscribe the handler
   */
  onSearchStop: (handler: () => void) => () => void;

  /**
   * Get the current search flags
   * @returns Array of active search flags
   */
  getFlags: () => MatchFlag[];

  /**
   * Set the search flags
   * @param flags - Array of search flags to use
   */
  setFlags: (flags: MatchFlag[]) => void;
}