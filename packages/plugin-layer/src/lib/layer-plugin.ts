import { IPlugin, PluginRegistry } from "@embedpdf/core";
import { PdfDocumentObject, PdfEngine, PdfPageObject } from "@embedpdf/models";
import { LayerCapability, LayerPluginConfig, LayerRenderOptions, ILayerPlugin } from "./types";

export class LayerPlugin implements IPlugin<LayerPluginConfig> {
  private layers: Map<string, ILayerPlugin> = new Map();

  constructor(
    public readonly id: string,
    private registry: PluginRegistry,
    private _engine: PdfEngine
  ) {
  }

  provides(): LayerCapability {
    return {
      render: (pdfDocument, pageIndex, container, options) => 
        this.renderLayers(pdfDocument, pageIndex, container, options),
      getLayerById: (id) => this.getLayer(id),
      addLayer: (layer) => this.addLayer(layer),
      removeLayer: (id) => this.removeLayer(id)
    };
  }

  async initialize(config: LayerPluginConfig): Promise<void> {
    // Register each layer as a plugin
    for (const layer of config.layers) {
      await this.registry.registerPlugin({
        manifest: layer.package.manifest,
        create: (registry, engine) => {
          // Layer plugin creation logic
          const layerPlugin = layer.package.create(registry, engine);
          this.addLayer(layerPlugin);
          return layerPlugin;
        }
      });
    }
  }

  private addLayer(layer: ILayerPlugin): void {
    this.layers.set(layer.id, layer);
  }

  private removeLayer(layerId: string): void {
    this.layers.delete(layerId);
  }

  private getLayer(id: string): ILayerPlugin {
    const layer = this.layers.get(id);
    if (!layer) {
      throw new Error(`Layer ${id} not found`);
    }
    return layer;
  }

  private async renderLayers(
    pdfDocument: PdfDocumentObject,
    pageIndex: number,
    container: HTMLElement,
    options: LayerRenderOptions
  ): Promise<void> {
    const page = pdfDocument.pages[pageIndex];
    if (!page) {
      throw new Error(`Page index ${pageIndex} not found in document ${pdfDocument.id}`);
    }

    // Create container for all layers
    const layersContainer = document.createElement('div');
    layersContainer.style.position = 'relative';
    layersContainer.style.setProperty('--page-scale-factor', `var(--scale-factor, ${options.scale || 1})`);
    layersContainer.style.width = `round(down, var(--page-scale-factor) * ${page.size.width}px, 1px)`;
    layersContainer.style.height = `round(down, var(--page-scale-factor) * ${page.size.height}px, 1px)`;
    container.appendChild(layersContainer);

    // Render each layer
    for (const layer of this.layers.values()) {
      const layerElement = document.createElement('div');
      layerElement.className = `pdf-layer pdf-layer-${layer.id}`;
      layerElement.style.position = 'absolute';
      layerElement.style.top = '0';
      layerElement.style.left = '0';
      layerElement.style.width = '100%';
      layerElement.style.height = '100%';
      layerElement.style.zIndex = layer.zIndex.toString();
      layersContainer.appendChild(layerElement);

      await layer.render(pdfDocument, page, layerElement, options);
    }
  }

  async destroy(): Promise<void> {
    // Cleanup all layers
    for (const layer of this.layers.values()) {
      await layer?.destroy?.();
    }
    this.layers.clear();
  }
} 