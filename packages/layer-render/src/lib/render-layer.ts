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

    // Check if we can reuse the cached render
    if (this.isCacheValid(pdfDocument.id, page.index, container, options)) {
      const cache = this.getPageCache(pdfDocument.id, page.index);
      if (cache) {
        container.appendChild(cache.data.canvas);
        return;
      }
    }

    // Cancel any existing render task for this page
    const existingCache = this.getPageCache(pdfDocument.id, page.index);
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
      this.clearCache(pdfDocument.id, page.index);
      throw error;
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
      for (const [pageNum, pageCache] of docCache.pages.entries()) {
        if (pageCache.data.renderTask) {
          pageCache.data.renderTask.abort({
            code: PdfErrorCode.Cancelled,
            message: 'Render task cancelled due to layer destruction',
          });
        }
      }
    }
    await super.destroy();
  }
}