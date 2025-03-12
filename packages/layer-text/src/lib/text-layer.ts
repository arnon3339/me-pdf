import { BaseLayerPlugin, LayerRenderOptions } from "@embedpdf/plugin-layer";
import { TextLayerConfig } from "./types";
import { PluginRegistry } from "@embedpdf/core";
import { PdfDocumentObject, PdfEngine, PdfPageObject } from "@embedpdf/models";

export class TextLayer extends BaseLayerPlugin<TextLayerConfig> {
  public zIndex = 1100;

  constructor(
    public readonly id: string,
    registry: PluginRegistry,
    engine: PdfEngine
  ) {
    super(id, registry, engine);
  }

  async render(pdfDocument: PdfDocumentObject, page: PdfPageObject, container: HTMLElement, options: LayerRenderOptions): Promise<void> {
   
    
  }
}