import { BasePlugin, PluginRegistry } from "@embedpdf/core";
import { RenderCapability, RenderPluginConfig } from "./types";
import { PdfEngine, PdfPageObject, Rotation } from "@embedpdf/models";

export class RenderPlugin extends BasePlugin<RenderPluginConfig, RenderCapability> {
  private engine: PdfEngine;

  constructor(id: string, registry: PluginRegistry, engine: PdfEngine) {
    super(id, registry);
    this.engine = engine;
  }

  async initialize(_config: RenderPluginConfig): Promise<void> {

  }

  protected buildCapability(): RenderCapability {
    return {
      renderPage: this.renderPage.bind(this),
    };
  }

  private renderPage(pageIndex: number, scaleFactor: number, dpr: number) {
    const coreState = this.getCoreState().core;

    if (!coreState.document) {
      throw new Error('document does not open');
    }

    const page = coreState.document.pages.find(page => page.index === pageIndex);
    if (!page) {
      throw new Error('page does not exist');
    }

    return this.engine.renderPage(coreState.document, page, scaleFactor, Rotation.Degree0, dpr, {
      withAnnotations: true,
    });
  }
}