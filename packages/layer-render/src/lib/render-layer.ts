import { PluginRegistry } from "@embedpdf/core";
import { PdfDocumentObject, PdfEngine, PdfErrorCode, PdfPageObject, PdfTask } from "@embedpdf/models";
import { LayerRenderOptions, BaseLayerPlugin } from "@embedpdf/plugin-layer";
import { RenderLayerConfig } from "./types";

interface RenderCacheData {
  canvas: HTMLCanvasElement;
  renderTask?: PdfTask<ImageData>;
  scale: number;
  rotation: number;
}

export class RenderLayer extends BaseLayerPlugin<RenderLayerConfig, RenderCacheData> {
  public zIndex = 1000;

  constructor(
    public readonly id: string,
    registry: PluginRegistry,
    engine: PdfEngine
  ) {
    super(id, registry, engine);
  }

  async render(
    pdfDocument: PdfDocumentObject, 
    page: PdfPageObject, 
    container: HTMLElement, 
    options: LayerRenderOptions
  ): Promise<void> {
    const scale = options.scale || 1;
    const rotation = options.rotation || 0;
    const topic = options.topic || 'default';

    // Check if we can reuse the cached render
    if (this.isCacheValid(pdfDocument.id, page.index, container, options)) {
      const cache = this.getPageCache(pdfDocument.id, page.index, topic);
      if (cache) {
        container.appendChild(cache.data.canvas);
        return;
      }
    }

    // Cancel any existing render task for this page and topic
    const existingCache = this.getPageCache(pdfDocument.id, page.index, topic);
    if (existingCache?.data.renderTask) {
      existingCache.data.renderTask.abort({
        code: PdfErrorCode.Cancelled,
        message: 'Render task cancelled due to new render request',
      });
    }

    // Create new canvas
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    // Start new render task
    const renderTask = this.engine.renderPage(
      pdfDocument,
      page,
      scale,
      rotation,
      window.devicePixelRatio,
      {
        withAnnotations: true,
      }
    );

    // Cache the initial state
    this.setPageCache(pdfDocument.id, page.index, page, container, options, {
      canvas,
      renderTask,
      scale,
      rotation
    });

    try {
      // Wait for render to complete
      await new Promise<void>((resolve, reject) => {
        renderTask.wait(
          (imageData) => {
            this.renderToCanvas(canvas, imageData);
            resolve();
          },
          (error) => reject(error)
        );
      });

      // Update cache with completed state (remove render task reference)
      this.setPageCache(pdfDocument.id, page.index, page, container, options, {
        canvas,
        scale,
        rotation
      });
    } catch (error) {
      // Clean up on error
      canvas.remove();
      this.clearCache(pdfDocument.id, page.index, topic);
      throw error;
    }
  }

  /**
   * Update an existing render with new options
   */
  async updateRender(
    pdfDocument: PdfDocumentObject,
    page: PdfPageObject,
    container: HTMLElement,
    options: LayerRenderOptions
  ): Promise<void> {
    const scale = options.scale || 1;
    const rotation = options.rotation || 0;
    const topic = options.topic || 'default';
    
    // Get the existing canvas if it exists
    const existingCache = this.getPageCache(pdfDocument.id, page.index, topic);
    const existingCanvas = existingCache?.data.canvas;
    
    // If we have existing canvas but scale or rotation changed, we need to re-render
    if (existingCanvas && (
        existingCache.data.scale !== scale || 
        existingCache.data.rotation !== rotation
    )) {
      // If there's an active render task, cancel it
      if (existingCache.data.renderTask) {
        existingCache.data.renderTask.abort({
          code: PdfErrorCode.Cancelled,
          message: 'Render task cancelled due to update request',
        });
      }
      
      // Remove existing canvas from container
      if (existingCanvas.parentNode === container) {
        container.removeChild(existingCanvas);
      }
      
      // Start a new render task
      const renderTask = this.engine.renderPage(
        pdfDocument,
        page,
        scale,
        rotation,
        window.devicePixelRatio,
        {
          withAnnotations: true,
        }
      );
      
      // Reuse existing canvas
      container.appendChild(existingCanvas);
      
      // Update cache with new render task
      this.setPageCache(pdfDocument.id, page.index, page, container, options, {
        canvas: existingCanvas,
        renderTask,
        scale,
        rotation
      });
      
      try {
        // Wait for render to complete
        await new Promise<void>((resolve, reject) => {
          renderTask.wait(
            (imageData) => {
              this.renderToCanvas(existingCanvas, imageData);
              resolve();
            },
            (error) => reject(error)
          );
        });
        
        // Update cache with completed state
        this.setPageCache(pdfDocument.id, page.index, page, container, options, {
          canvas: existingCanvas,
          scale,
          rotation
        });
      } catch (error) {
        // Clean up on error
        existingCanvas.remove();
        this.clearCache(pdfDocument.id, page.index, topic);
        throw error;
      }
    } else if (!existingCanvas) {
      // If no existing canvas, just do a normal render
      await this.render(pdfDocument, page, container, options);
    }
    // If existing canvas and no scale/rotation change, nothing to do
  }
  
  /**
   * Remove cache for a specific document, page, and topic
   * For render layer, we always honor cache clearing (even if not forced)
   */
  async removeCache(documentId: string, pageNumber: number, topic?: string, force?: boolean): Promise<void> {
    const pageTopics = new Set<string>();
    
    // If topic is specified, clear just that topic, otherwise clear all topics for this page
    if (topic) {
      pageTopics.add(topic);
    } else {
      const docCache = this.documentCache.get(documentId);
      if (docCache) {
        const pageCache = docCache.pages.get(pageNumber);
        if (pageCache) {
          // Collect all topics for this page
          for (const topicKey of pageCache.keys()) {
            pageTopics.add(topicKey);
          }
        }
      }
    }
    
    // Clear each topic's cache
    for (const topicKey of pageTopics) {
      const cache = this.getPageCache(documentId, pageNumber, topicKey);
      
      // Cancel any active render task
      if (cache?.data.renderTask) {
        cache.data.renderTask.abort({
          code: PdfErrorCode.Cancelled,
          message: 'Render task cancelled due to cache clearing',
        });
      }
      
      // Remove canvas from DOM if it's still there
      if (cache?.data.canvas.parentNode) {
        cache.data.canvas.remove();
      }
      
      // Clear the cache
      this.clearCache(documentId, pageNumber, topicKey);
    }
  }

  private renderToCanvas(canvas: HTMLCanvasElement, imageData: ImageData): void {
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(imageData, 0, 0);
    }
  }

  async destroy(): Promise<void> {
    // Cancel all active render tasks before clearing cache
    for (const [docId, docCache] of this.documentCache.entries()) {
      for (const [pageNum, pageTopics] of docCache.pages.entries()) {
        for (const [topic, pageCache] of pageTopics.entries()) {
          if (pageCache.data.renderTask) {
            pageCache.data.renderTask.abort({
              code: PdfErrorCode.Cancelled,
              message: 'Render task cancelled due to layer destruction',
            });
          }
          
          // Remove canvas from DOM if it's still there
          if (pageCache.data.canvas.parentNode) {
            pageCache.data.canvas.remove();
          }
        }
      }
    }
    await super.destroy();
  }
}