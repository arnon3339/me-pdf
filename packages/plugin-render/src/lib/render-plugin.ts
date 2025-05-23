import { BasePlugin, PluginRegistry } from '@embedpdf/core';
import {
  RenderCapability,
  RenderPageOptions,
  RenderPageRectOptions,
  RenderPluginConfig,
} from './types';
import { PdfEngine, Rotation } from '@embedpdf/models';

export class RenderPlugin extends BasePlugin<RenderPluginConfig, RenderCapability> {
  static readonly id = 'render' as const;
  private engine: PdfEngine;

  constructor(id: string, registry: PluginRegistry, engine: PdfEngine) {
    super(id, registry);
    this.engine = engine;
  }

  async initialize(_config: RenderPluginConfig): Promise<void> {}

  protected buildCapability(): RenderCapability {
    return {
      renderPage: this.renderPage.bind(this),
      renderPageRect: this.renderPageRect.bind(this),
    };
  }

  private renderPage({
    pageIndex,
    scaleFactor = 1,
    dpr = 1,
    rotation = Rotation.Degree0,
    options = { withAnnotations: false },
  }: RenderPageOptions) {
    const coreState = this.getCoreState().core;

    if (!coreState.document) {
      throw new Error('document does not open');
    }

    const page = coreState.document.pages.find((page) => page.index === pageIndex);
    if (!page) {
      throw new Error('page does not exist');
    }

    return this.engine.renderPage(coreState.document, page, scaleFactor, rotation, dpr, options);
  }

  private renderPageRect({
    pageIndex,
    scaleFactor = 1,
    dpr = 1,
    rect,
    rotation = Rotation.Degree0,
    options = { withAnnotations: false },
  }: RenderPageRectOptions) {
    const coreState = this.getCoreState().core;

    if (!coreState.document) {
      throw new Error('document does not open');
    }

    const page = coreState.document.pages.find((page) => page.index === pageIndex);
    if (!page) {
      throw new Error('page does not exist');
    }

    return this.engine.renderPageRect(
      coreState.document,
      page,
      scaleFactor,
      rotation,
      dpr,
      rect,
      options,
    );
  }
}
