import { ignore, PdfPageObject } from '@embedpdf/models';
import { BaseLayer } from '@embedpdf/plugin-layer';
import { NavigationPlugin } from '../NavigationPlugin';
import { ViewportRegion, ViewportState } from '../types';

export class ViewportRenderLayer extends BaseLayer {
  readonly id = 'render';
  readonly zIndex = 1;
  private cleanupListeners: (() => void)[] = [];
  private pageCanvases: Map<number, HTMLCanvasElement> = new Map();
  private lastRegions: Map<number, string> = new Map();

  async render(page: PdfPageObject, container: HTMLElement) {
    if(!this.core) throw new Error('Plugin not initialized');

    const navigationPlugin = this.core.getPlugin<NavigationPlugin>('navigation');
    if(!navigationPlugin) throw new Error('Navigation plugin not initialized');

    const viewportState = navigationPlugin.getViewportState();
    this.viewportStateHandler(page, container, viewportState);
  
    const cleanup = this.core.on('navigation:viewportStateChanged', (viewportState) => this.viewportStateHandler(page, container, viewportState));

    this.cleanupListeners.push(cleanup);
  }

  private viewportStateHandler = async (page: PdfPageObject, container: HTMLElement, viewportState: ViewportState) => {
    if(!this.core) return;

    const pdfDocument = this.core?.getDocument();
    if(!pdfDocument) return;

    const region = viewportState.viewportRegions.find(r => r.pageNumber === page.index + 1);
    
    if (region) {
      const regionKey = `${region.pageX},${region.pageY},${region.visibleWidth},${region.visibleHeight}`;
      if(region.visibleHeight < 2) return;
      
      if (this.lastRegions.get(page.index) === regionKey) {
        return;
      }
      
      let canvas = this.pageCanvases.get(page.index);
      
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.pointerEvents = 'none';
        container.appendChild(canvas);
        this.pageCanvases.set(page.index, canvas);
      }

      const rect = {
        origin: { x: region.pageX, y: region.pageY },
        size: { width: region.visibleWidth, height: region.visibleHeight }
      };

      const pdfTask = await this.core.engine.renderPageRect(
        pdfDocument,
        page,
        viewportState.zoomLevel,
        0,
        window.devicePixelRatio,
        rect,
        { withAnnotations: true }
      );

      pdfTask.wait((imageData) => this.renderToCanvas(canvas, imageData, region), ignore);

      this.lastRegions.set(page.index, regionKey);
    } else {
      const canvas = this.pageCanvases.get(page.index);
      if (canvas) {
        canvas.remove();
        this.pageCanvases.delete(page.index);
      }
      this.lastRegions.delete(page.index);
    }
  }

  renderToCanvas(canvas: HTMLCanvasElement, imageData: ImageData, region: ViewportRegion) {
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx?.putImageData(imageData, 0, 0);
    
    canvas.style.left = `round(down, var(--scale-factor) * ${region.pageX}px, 1px)`;
    canvas.style.top = `round(down, var(--scale-factor) * ${region.pageY}px, 1px)`;
    canvas.style.width = `round(down, var(--scale-factor) * ${region.visibleWidth}px, 1px)`;
    canvas.style.height = `round(down, var(--scale-factor) * ${region.visibleHeight}px, 1px)`;

    return canvas;
  }

  async destroy() {
    this.pageCanvases.forEach(canvas => canvas.remove());
    this.pageCanvases.clear();
    this.lastRegions.clear();
    
    this.cleanupListeners.forEach(cleanup => cleanup());
    this.cleanupListeners = [];
    
    await super.destroy();
  }
}