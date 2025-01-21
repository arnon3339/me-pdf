import { IPlugin, IPDFCore } from '@cloudpdf/core';
import { PdfDocumentObject, PdfPageObject } from '@cloudpdf/models';

import { DEFAULT_INITIAL_PAGE, DEFAULT_SCROLL_MODE, DEFAULT_ZOOM_MODE, DEFAULT_ZOOM_LEVEL, DEFAULT_PAGE_LAYOUT, DEFAULT_ORIENTATION } from "./constants";
import { NavigationOptions, NavigationState, PageElement } from "./types";
import { ContinuousScrollMode } from './scroll-modes/continuous';
import { ScrollModeBase } from './scroll-modes/base';

export class NavigationPlugin implements IPlugin {
  readonly name = 'navigation';
  readonly version = '1.0.0';
  
  private core?: IPDFCore;
  private state: NavigationState;
  private scrollModeHandler?: ScrollModeBase;
  
  constructor(options?: NavigationOptions) {
    this.state = {
      currentPage: options?.initialPage ?? DEFAULT_INITIAL_PAGE,
      totalPages: 0,
      pages: [],
      scrollMode: options?.defaultScrollMode ?? DEFAULT_SCROLL_MODE,
      zoomMode: options?.defaultZoomMode ?? DEFAULT_ZOOM_MODE,
      zoomLevel: options?.defaultZoomLevel ?? DEFAULT_ZOOM_LEVEL,
      pageLayout: options?.defaultPageLayout ?? DEFAULT_PAGE_LAYOUT,
      orientation: options?.defaultOrientation ?? DEFAULT_ORIENTATION
    };

    if (options?.container) {
      this.setContainer(options.container);
    }
  }

  setContainer(element: HTMLElement): void {
    this.state.container = {
      element,
      width: element.clientWidth,
      height: element.clientHeight
    };

    element.style.setProperty('--scale-factor', `${this.state.zoomLevel}`);
  }

  private createPageElement(page: PdfPageObject): PageElement {
    const element = document.createElement('div');
    element.className = 'pdf-page';
    element.setAttribute('data-page', String(page.index));

    element.style.width = `round(down, var(--scale-factor) * ${page.size.width}px, 1px)`;
    element.style.height = `round(down, var(--scale-factor) * ${page.size.height}px, 1px)`;
    element.style.backgroundColor = 'white';
    
    // Remove position relative and left margin
    // Use margin auto to center the page
    element.style.margin = '0 auto';
    
    return {
      page,
      element
    };
  }

  private initializeScrollMode(): void {
    if (!this.state.container) return;
    if (!this.core) return;

    this.scrollModeHandler?.destroy();

    switch (this.state.scrollMode) {
      case 'continuous':
        this.scrollModeHandler = new ContinuousScrollMode({
          core: this.core,
          container: this.state.container.element,
          state: this.state
        });
        break;
    }

    this.scrollModeHandler?.initialize();
  }

  async initialize(core: IPDFCore): Promise<void> {
    this.core = core;

    // Set up event listeners
    core.on('document:loaded', (doc: PdfDocumentObject) => {
      this.setState({ totalPages: doc.pageCount, pages: doc.pages.map(page => this.createPageElement(page)) });
      this.initializeScrollMode();
    });
  }

  async destroy(): Promise<void> {
    this.core = undefined;
  }

  getState(): NavigationState {
    return { ...this.state };
  }

  setState(newState: Partial<NavigationState>): void {
    Object.assign(this.state, newState);
    this.core?.emit(`${this.name}:stateChange`, this.state);
  }

  async goToPage(pageNumber: number): Promise<void> {
    if (pageNumber < 1 || pageNumber > this.state.totalPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    this.scrollModeHandler?.goToPage(pageNumber);
  }

  async updateZoomLevel(zoomLevel: number): Promise<void> {
    this.setState({ zoomLevel });
    this.state.container?.element.style.setProperty('--scale-factor', `${zoomLevel}`);
    this.scrollModeHandler?.updateLayout();
  }
}