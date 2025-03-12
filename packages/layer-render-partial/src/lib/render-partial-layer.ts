import { PdfPageObject, PdfDocumentObject, PdfEngine, PdfTask, PdfErrorCode, transformRect, Rotation, restoreRect, transformSize } from "@embedpdf/models";
import { RenderPartialLayerConfig } from "./types";
import { BaseLayerPlugin, LayerRenderOptions } from "@embedpdf/plugin-layer";
import { PluginRegistry } from "@embedpdf/core";
import { ScrollCapability, ScrollMetrics, ScrollPlugin } from "@embedpdf/plugin-scroll";
import { ViewportCapability, ViewportMetrics, ViewportPlugin } from "@embedpdf/plugin-viewport";

interface RenderPartialCacheData {
  canvas: HTMLCanvasElement;
  renderTask?: PdfTask<ImageData>;
  scale: number;
  rotation: number;
  regionKey: string;
}

interface PageContext {
  pdfDocument: PdfDocumentObject;
  page: PdfPageObject;
  container: HTMLElement;
  options: LayerRenderOptions;
}

export class RenderPartialLayer extends BaseLayerPlugin<RenderPartialLayerConfig, RenderPartialCacheData> {
  public zIndex = 2000;
  private scroll: ScrollCapability;
  private viewport: ViewportCapability;
  private minScale: number = 0;
  private pageVisibleRegions: Map<number, string> = new Map();
  private activePages: Map<number, PageContext> = new Map();

  constructor(
    public readonly id: string,
    registry: PluginRegistry,
    engine: PdfEngine
  ) {
    super(id, registry, engine);
    this.scroll = this.registry.getPlugin<ScrollPlugin>('scroll').provides();
    this.viewport = this.registry.getPlugin<ViewportPlugin>('viewport').provides();

    this.viewport.onViewportChange(this.handleViewportChange.bind(this), { mode: 'debounce', wait: 250 });
  }

  async initialize(config: RenderPartialLayerConfig): Promise<void> {
    this.minScale = config.minScale ?? 0;
  }

  private handleViewportChange(metrics: ViewportMetrics): void {
    const scrollMetrics = this.scroll.getMetrics(metrics);
    
    // Update visible regions for current view and clean up invisible pages
    this.updateVisibleRegions(scrollMetrics);
    
    // Re-render pages that are currently visible
    this.renderVisiblePages(scrollMetrics);
  }

  private updateVisibleRegions(scrollMetrics: ScrollMetrics): void {
    const visiblePageNumbers = new Set(scrollMetrics.visiblePages);
    
    // Clean up pages that are no longer visible
    for (const [pageIndex, pageContext] of this.activePages.entries()) {
      if (!visiblePageNumbers.has(pageIndex + 1)) {
        // If page is no longer visible, clean up its rendered content
        this.cleanupPageContent(
          pageContext.pdfDocument.id,
          pageIndex,
          pageContext.options.topic || 'default'
        );
      }
    }
    
    // Clear cache regions for pages that are no longer visible
    for (const pageIndex of this.pageVisibleRegions.keys()) {
      if (!visiblePageNumbers.has(pageIndex + 1)) {
        this.pageVisibleRegions.delete(pageIndex);
      }
    }
  }

  /**
   * Thoroughly clean up a canvas and remove it from DOM to prevent memory leaks
   */
  private cleanupCanvas(canvas: HTMLCanvasElement): void {
    // Special canvas cleanup for iOS/Safari memory management
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx && ctx.clearRect(0, 0, 1, 1);
    
    // Remove from DOM if it's there
    if (canvas.parentElement) {
      canvas.parentElement.removeChild(canvas);
    }
  }
  
  /**
   * Clean up all content for a page
   */
  private async cleanupPageContent(documentId: string, pageIndex: number, topic: string = 'default'): Promise<void> {
    // Get the cache for this page
    const cache = this.getPageCache(documentId, pageIndex, topic);
    
    if (cache) {
      // Cancel any ongoing render task
      if (cache.data.renderTask) {
        cache.data.renderTask.abort({
          code: PdfErrorCode.Cancelled,
          message: 'Page no longer visible, cancelling render task'
        });
      }
      
      // Clean up the canvas
      this.cleanupCanvas(cache.data.canvas);
    }
    
    // Remove from cache
    await this.removeCache(documentId, pageIndex, topic);
    
    // Remove from visible regions
    this.pageVisibleRegions.delete(pageIndex);
  }

  private renderVisiblePages(scrollMetrics: ScrollMetrics): void {
    // For each visible page that we have in activePages, render its visible portion
    for (const pageNumber of scrollMetrics.visiblePages) {
      const pageIndex = pageNumber - 1;
      const pageContext = this.activePages.get(pageIndex);
      
      if (pageContext) {
        // If the page is active and visible, update its render
        this.renderPagePartial(
          pageContext.pdfDocument,
          pageContext.page,
          pageContext.container,
          pageContext.options,
          scrollMetrics
        );
      }
    }
  }

  private getVisibleRegionForPage(pageIndex: number, scrollMetrics: ScrollMetrics): { 
    pageX: number, 
    pageY: number, 
    visibleWidth: number, 
    visibleHeight: number 
  } | null {
    const pageVisibility = scrollMetrics.pageVisibilityMetrics.find(
      p => p.pageNumber === pageIndex + 1
    );

    if (!pageVisibility) return null;

    return {
      pageX: pageVisibility.pageX,
      pageY: pageVisibility.pageY,
      visibleWidth: pageVisibility.visibleWidth,
      visibleHeight: pageVisibility.visibleHeight
    };
  }

  async render(
    pdfDocument: PdfDocumentObject, 
    page: PdfPageObject, 
    container: HTMLElement, 
    options: LayerRenderOptions
  ): Promise<void> {
    // Store the page context for later viewport updates
    this.activePages.set(page.index, {
      pdfDocument,
      page,
      container,
      options
    });

    // Get current scroll metrics
    const scrollMetrics = this.scroll.getMetrics(this.viewport.getMetrics());
    
    // Render the page initially
    await this.renderPagePartial(pdfDocument, page, container, options, scrollMetrics);
  }

  private async renderPagePartial(
    pdfDocument: PdfDocumentObject, 
    page: PdfPageObject, 
    container: HTMLElement, 
    options: LayerRenderOptions,
    scrollMetrics: ScrollMetrics
  ): Promise<void> {
    const topic = options.topic || 'default';
    
    // If scale is below minScale, don't render with partial renderer
    if (options.scale < this.minScale) {
      // Clean up any existing partial render
      await this.cleanupPageContent(pdfDocument.id, page.index, topic);
      return;
    }

    const visibleRegion = this.getVisibleRegionForPage(page.index, scrollMetrics);

    // If the page is not visible or has no visible region, don't render
    if (!visibleRegion || visibleRegion.visibleHeight < 2) {
      // Clean up any existing partial render
      await this.cleanupPageContent(pdfDocument.id, page.index, topic);
      return;
    }

    // Create a unique key for this region to detect changes
    const regionKey = `${visibleRegion.pageX},${visibleRegion.pageY},${visibleRegion.visibleWidth},${visibleRegion.visibleHeight}`;

    // If the visible region hasn't changed, no need to re-render
    if (this.pageVisibleRegions.get(page.index) === regionKey) {
      // Add existing canvas to container if available
      const cache = this.getPageCache(pdfDocument.id, page.index, topic);
      if (cache && container.contains(cache.data.canvas) === false) {
        container.appendChild(cache.data.canvas);
      }
      return;
    }
    
    // Cancel any existing render task
    const existingCache = this.getPageCache(pdfDocument.id, page.index, topic);
    if (existingCache?.data.renderTask) {
      existingCache.data.renderTask.abort({ 
        code: PdfErrorCode.Cancelled, 
        message: 'Render task cancelled due to region change' 
      });
    }

    // Create or reuse canvas
    let canvas: HTMLCanvasElement;
    if (existingCache) {
      canvas = existingCache.data.canvas;
    } else {
      canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.pointerEvents = 'none';
    }

    // Define the rectangle to render
    const rect = {
      origin: { x: visibleRegion.pageX, y: visibleRegion.pageY },
      size: { width: visibleRegion.visibleWidth, height: visibleRegion.visibleHeight }
    };

    const rotatedRect = restoreRect(transformSize(page.size, options.rotation, 1), rect, options.rotation, 1);
    
    // Render only the visible portion of the page
    const devicePixelRatio = window.devicePixelRatio || 1;
    const renderTask = await this.engine.renderPageRect(
      pdfDocument,
      page,
      options.scale,
      options.rotation,
      devicePixelRatio,
      rotatedRect,
      { withAnnotations: true }
    );

    // Store the task in the cache to be able to cancel it if needed
    this.setPageCache(
      pdfDocument.id,
      page.index,
      page,
      container,
      options,
      {
        canvas,
        renderTask,
        scale: options.scale,
        rotation: options.rotation,
        regionKey
      }
    );

    // Add to container if not already there
    if (container.contains(canvas) === false) {
      container.appendChild(canvas);
    }

    // Wait for the rendering to complete and then update the canvas
    renderTask.wait(
      (imageData) => {
        this.renderToCanvas(canvas, imageData, visibleRegion);
        this.pageVisibleRegions.set(page.index, regionKey);
      },
      (error) => {
        console.error('Error rendering page rect:', error);
      }
    );
  }

  private renderToCanvas(
    canvas: HTMLCanvasElement, 
    imageData: ImageData, 
    region: { pageX: number, pageY: number, visibleWidth: number, visibleHeight: number }
  ): void {
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.putImageData(imageData, 0, 0);
    
    // Position the canvas using CSS variables for proper scaling
    canvas.style.left = `round(down, var(--scale-factor) * ${region.pageX}px, 1px)`;
    canvas.style.top = `round(down, var(--scale-factor) * ${region.pageY}px, 1px)`;
    canvas.style.width = `round(down, var(--scale-factor) * ${region.visibleWidth}px, 1px)`;
    canvas.style.height = `round(down, var(--scale-factor) * ${region.visibleHeight}px, 1px)`;
  }
  
  // Override removeCache to ensure thorough canvas cleanup
  async removeCache(documentId: string, pageNumber: number, topic: string = 'default', force: boolean = false): Promise<void> {
    const cache = this.getPageCache(documentId, pageNumber, topic);
    if (cache) {
      this.cleanupCanvas(cache.data.canvas);
    }
    
    await super.removeCache(documentId, pageNumber, topic, force);
  }

  async destroy(): Promise<void> {
    // Clean up all canvases for all documents and pages
    for (const [documentId, docCache] of this.documentCache.entries()) {
      for (const [pageIndex, topicMap] of docCache.pages.entries()) {
        for (const [topic, pageCache] of topicMap.entries()) {
          this.cleanupCanvas(pageCache.data.canvas);
        }
      }
    }
    
    this.pageVisibleRegions.clear();
    this.activePages.clear();
    await super.destroy();
  }
}