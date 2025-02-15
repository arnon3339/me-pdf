import { IPDFCore, BasePlugin } from "@embedpdf/core";
import { PdfDocumentObject, PdfEngine, PdfErrorCode, PdfPageObject, PdfTask, Rotation } from "@embedpdf/models";

interface RenderOptions {
  withAnnotations?: boolean;
  devicePixelRatio?: number;
  scale?: number;
  rotation?: Rotation;
}

interface RendererState {
  activeRenderTasks: Map<PdfPageObject, PdfTask<ImageData>>;
}

export class RendererPlugin extends BasePlugin<RendererState> {
  readonly name = 'renderer';
  readonly version = '1.0.0';

  private engine?: PdfEngine;
  private document?: PdfDocumentObject;

  constructor() {
    super({
      activeRenderTasks: new Map()
    });
  }

  async initialize(core: IPDFCore): Promise<void> {
    this.core = core;
    this.engine = core.engine;

    // Listen for document loading
    core.on('document:loaded', (doc: PdfDocumentObject) => {
      this.document = doc;
    });
  }

  async destroy(): Promise<void> {
    // Cancel any active render tasks
    this.state.activeRenderTasks.forEach(task => task.abort({
      code: PdfErrorCode.Cancelled,
      message: 'Render task cancelled',
    }));
    this.state.activeRenderTasks.clear();
    
    this.core = undefined;
    this.engine = undefined;
    this.document = undefined;
  }

  getState(): RendererState {
    return { ...this.state };
  }

  setState(newState: Partial<RendererState>): void {
    this.state = { ...this.state, ...newState };
    this.core?.emit(`${this.name}:stateChange`, this.state);
  }

  async renderPage(
    page: PdfPageObject,
    canvas: HTMLCanvasElement,
    options: RenderOptions = {}
  ): Promise<void> {
    if (!this.engine || !this.document) {
      throw new Error('No document or engine available');
    }

    // Cancel any existing render task for this page
    this.cancelRenderTask(page);

    try {
      const renderTask = this.engine.renderPage(
        this.document,
        page,
        options.scale ?? 1,
        options.rotation ?? 0,
        options.devicePixelRatio || window.devicePixelRatio,
        {
          withAnnotations: options.withAnnotations ?? true,
        }
      );

      this.state.activeRenderTasks.set(page, renderTask);

      renderTask.wait((imageData) => this.renderToCanvas(page,canvas, imageData), (error) => {
        throw error;
      });
    } catch (error) {
      throw error;
    } finally {
      this.state.activeRenderTasks.delete(page);
    }
  }

  private renderToCanvas(page: PdfPageObject, canvas: HTMLCanvasElement, imageData: ImageData): void {
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(imageData, 0, 0);
    }

    this.core?.emit(`${this.name}:pageRendered`, { 
      page: page,
      width: imageData.width,
      height: imageData.height
    });
  }

  private cancelRenderTask(page: PdfPageObject): void {
    const task = this.state.activeRenderTasks.get(page);
    if (task) {
      task.abort({
        code: PdfErrorCode.Cancelled,
        message: 'Render task cancelled',
      });
      this.state.activeRenderTasks.delete(page);
    }
  }
}