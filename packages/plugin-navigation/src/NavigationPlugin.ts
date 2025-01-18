import { IPlugin, PDFEngine } from '@cloudpdf/core';

import { NavigationState } from "./types";

import { DEFAULT_INITIAL_PAGE } from "./constants";

import { DEFAULT_SCROLL_MODE } from "./constants";
import { NavigationOptions } from "./types";

export class NavigationPlugin implements IPlugin {
  readonly name = 'navigation';
  readonly version = '1.0.0';
  
  private engine?: PDFEngine;
  private state: NavigationState;

  constructor(options?: NavigationOptions) {
    this.state = {
      currentPage: options?.initialPage ?? DEFAULT_INITIAL_PAGE,
      totalPages: 0,
      scrollMode: options?.defaultScrollMode ?? DEFAULT_SCROLL_MODE
    };
  }

  async initialize(engine: PDFEngine): Promise<void> {
    this.engine = engine;

    // Set up event listeners
    engine.on('document:loaded', ({ pageCount }) => {
      this.setState({ totalPages: pageCount });
    });
  }

  async destroy(): Promise<void> {
    this.engine = undefined;
  }

  getState(): NavigationState {
    return { ...this.state };
  }

  setState(newState: Partial<NavigationState>): void {
    this.state = { ...this.state, ...newState };
    this.engine?.emit(`${this.name}:stateChange`, this.state);
  }

  async goToPage(pageNumber: number): Promise<void> {
    if (pageNumber < 1 || pageNumber > this.state.totalPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    this.setState({ currentPage: pageNumber });
    this.engine?.emit(`${this.name}:pageChanged`, { pageNumber });
  }

  setScrollMode(mode: 'vertical' | 'horizontal' | 'wrapped'): void {
    this.setState({ scrollMode: mode });
    this.engine?.emit(`${this.name}:scrollModeChanged`, { mode });
  }
}