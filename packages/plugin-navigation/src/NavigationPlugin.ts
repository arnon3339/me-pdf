import { IPlugin, IPDFCore, PageContainer } from '@cloudpdf/core';
import { PdfDocumentObject, PdfPageObject } from '@cloudpdf/models';

import { DEFAULT_INITIAL_PAGE, DEFAULT_SCROLL_MODE, DEFAULT_ZOOM_MODE, DEFAULT_ZOOM_LEVEL, DEFAULT_PAGE_LAYOUT, DEFAULT_ORIENTATION, DEFAULT_MIN_ZOOM, DEFAULT_MAX_ZOOM } from "./constants";
import { NavigationOptions, NavigationState, ViewportState } from "./types";
import { ContinuousScrollMode } from './scroll-modes/continuous';
import { ScrollModeBase } from './scroll-modes/base';
import { ZoomController } from './zoom/ZoomController';
import { LayerPlugin } from '@cloudpdf/plugin-layer';

export class NavigationPlugin implements IPlugin {
  readonly name = 'navigation';
  readonly version = '1.0.0';
  
  private core?: IPDFCore;
  private state: NavigationState;
  private scrollModeHandler?: ScrollModeBase;
  private zoomController?: ZoomController;
  private options?: NavigationOptions;

  constructor(options?: NavigationOptions) {
    this.options = options;
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
  }

  setContainer(element: HTMLElement): void {
    if (!this.core) return;

    this.state.container = {
      element,
      width: element.clientWidth,
      height: element.clientHeight
    };

    // Destroy existing zoom controller
    if(this.zoomController) {
      this.zoomController.destroy();
    }

    // Create new zoom controller
    this.zoomController = new ZoomController({
      container: element,
      state: this.state,
      core: this.core,
      options: {
        minZoom: this.options?.minZoom ?? DEFAULT_MIN_ZOOM,
        maxZoom: this.options?.maxZoom ?? DEFAULT_MAX_ZOOM,
        defaultZoom: this.options?.defaultZoomLevel ?? DEFAULT_ZOOM_LEVEL
      }
    });
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
    });
  }

  async destroy(): Promise<void> {
    this.core = undefined;
  }

  getViewportState(): ViewportState {
    if(!this.scrollModeHandler) throw new Error('scroll mode not initialized')

    return this.scrollModeHandler?.getViewportState();
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
    this.zoomController?.zoomTo(zoomLevel);
  }
}