import { BasePlugin, IPDFCore } from '@embedpdf/core';
import { ZoomState, IZoomPlugin, ZoomOptions, ZoomLevel } from './types';
import { DEFAULT_MAX_ZOOM, DEFAULT_MIN_ZOOM, DEFAULT_ZOOM_LEVEL } from './constants';
import { ZoomController } from './zoom/ZoomController';
import { PdfDocumentObject } from '@embedpdf/models';

export class ZoomPlugin extends BasePlugin<ZoomState> implements IZoomPlugin {
  readonly name = 'zoom';
  readonly version = '1.0.0';

  private zoomController?: ZoomController;
  private options?: ZoomOptions;

  constructor(options?: ZoomOptions) {
    super({
      currentZoomLevel: 1,
      zoomLevel: options?.defaultZoomLevel ?? DEFAULT_ZOOM_LEVEL,
    });

    this.options = options;
  }

  setContainer(element: HTMLElement): void {
    if (!this.core) return;

    this.state.container = element;

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
        defaultZoomLevel: this.options?.defaultZoomLevel ?? DEFAULT_ZOOM_LEVEL
      }
    });
  }

  async initialize(core: IPDFCore): Promise<void> {
    this.core = core;

    if (this.options?.container) {
      this.setContainer(this.options.container);
    }

    // Set up event listeners
    core.on('document:loaded', (doc: PdfDocumentObject) => {
      this.zoomController?.updateZoomLevel();
    });
  }

  getContainer(): HTMLElement | undefined {
    return this.state.container;
  }

  async updateZoomLevel(zoomLevel: ZoomLevel): Promise<void> {
    this.state.zoomLevel = zoomLevel;
    this.zoomController?.zoomTo(zoomLevel);
  }
}