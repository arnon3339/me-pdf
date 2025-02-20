import { IPDFCore, PageContainer, BasePlugin } from '@embedpdf/core';
import { PdfDocumentObject, PdfPageObject } from '@embedpdf/models';
import { DEFAULT_INITIAL_PAGE, DEFAULT_SCROLL_MODE, DEFAULT_PAGE_LAYOUT, DEFAULT_ORIENTATION } from "./constants";
import { NavigationOptions, NavigationState, ViewportState, INavigationPlugin } from "./types";
import { ContinuousScrollMode } from './scroll-modes/continuous';
import { ScrollModeBase } from './scroll-modes/base';
import { LayerPlugin } from '@embedpdf/plugin-layer';

export class NavigationPlugin extends BasePlugin<NavigationState> implements INavigationPlugin {
  readonly name = 'navigation';
  readonly version = '1.0.0';
  
  private scrollModeHandler?: ScrollModeBase;
  private options?: NavigationOptions;

  constructor(options?: NavigationOptions) {
    super({
      currentPage: options?.initialPage ?? DEFAULT_INITIAL_PAGE,
      totalPages: 0,
      pages: [],
      scrollMode: options?.defaultScrollMode ?? DEFAULT_SCROLL_MODE,
      pageLayout: options?.defaultPageLayout ?? DEFAULT_PAGE_LAYOUT,
      orientation: options?.defaultOrientation ?? DEFAULT_ORIENTATION,
      initialPage: options?.initialPage ?? DEFAULT_INITIAL_PAGE
    });

    this.options = options;
  }

  setContainer(element: HTMLElement): void {
    if (!this.core) return;

    this.state.container = {
      element,
      width: element.clientWidth,
      height: element.clientHeight
    };
  }

  private createPageElement(page: PdfPageObject): PageContainer {
    const layerPlugin = this.core?.getPlugin<LayerPlugin>('layers');

    if(layerPlugin) {
      return layerPlugin.renderPage(page);
    } else {
      return new PageContainer({ page });
    }
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

    if (this.options?.container) {
      this.setContainer(this.options.container);
    }

    // Set up event listeners
    core.on('document:loaded', (doc: PdfDocumentObject) => {
      // Set total pages and pages
      this.setState({ 
        totalPages: doc.pageCount, 
        pages: doc.pages.map(page => this.createPageElement(page)) 
      });
      // Initialize scroll mode
      this.initializeScrollMode();

      if(this.state.initialPage !== DEFAULT_INITIAL_PAGE) {
        this.goToPage(this.state.initialPage);
      }
    });
  }

  getViewportState(): ViewportState {
    if(!this.scrollModeHandler) throw new Error('scroll mode not initialized')

    return this.scrollModeHandler?.getViewportState();
  }

  async goToPage(pageNumber: number): Promise<void> {
    if (pageNumber < 1 || pageNumber > this.state.totalPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    this.scrollModeHandler?.goToPage(pageNumber);
  }
}