import { BasePlugin, IPlugin, PluginRegistry } from "@embedpdf/core";
import { PdfDocumentObject, PdfEngine, PdfPageObject, transformSize } from "@embedpdf/models";
import { LayerCapability, LayerPluginConfig, LayerRenderOptions, ILayerPlugin, LayerController } from "./types";

/**
 * Implementation of LayerController that manages a specific render context
 */
class LayerControllerImpl implements LayerController {
  constructor(
    private pdfDocument: PdfDocumentObject,
    private page: PdfPageObject,
    private layersContainer: HTMLElement,
    private renderOptions: LayerRenderOptions,
    private layers: Map<string, ILayerPlugin>,
    private layerElements: HTMLElement[]
  ) {}

  /**
   * Update layer render options
   */
  async update(newOptions: Partial<LayerRenderOptions>): Promise<void> {
    // Merge the new options with existing options
    const updatedOptions: LayerRenderOptions = {
      ...this.renderOptions,
      ...newOptions
    };
    
    // If scale or rotation changed, update container dimensions
    if (newOptions.scale !== undefined || newOptions.rotation !== undefined) {
      this.updateContainerDimensions(updatedOptions);
    }
    
    // Update each layer
    await this.updateLayersWithOptions(updatedOptions);
    
    // Store the updated options
    this.renderOptions = updatedOptions;
  }
  
  /**
   * Remove cache for the current render topic/context
   */
  async removeCache(force?: boolean): Promise<void> {
    // Call removeCache on each layer
    for (const [index, layer] of Array.from(this.layers.entries())) {
      if (layer.removeCache) {
        await layer.removeCache(
          this.pdfDocument.id, 
          this.page.index, 
          this.renderOptions.topic, 
          force
        );
      }
    }
  }
  
  /**
   * Update container dimensions based on scale and rotation
   */
  private updateContainerDimensions(options: LayerRenderOptions): void {
    const newTransformedSize = transformSize(this.page.size, options.rotation, 1);
    this.layersContainer.style.setProperty('--page-scale-factor', `var(--scale-factor, ${options.scale})`);
    this.layersContainer.style.width = `round(down, var(--page-scale-factor) * ${newTransformedSize.width}px, 1px)`;
    this.layersContainer.style.height = `round(down, var(--page-scale-factor) * ${newTransformedSize.height}px, 1px)`;
  }
  
  /**
   * Update all layers with new options
   */
  private async updateLayersWithOptions(options: LayerRenderOptions): Promise<void> {
    let layerIndex = 0;
    
    for (const layer of this.layers.values()) {
      const layerElement = this.layerElements[layerIndex];
      if (layerElement) {
        // Call updateRender if available, otherwise fallback to render
        if (layer.updateRender) {
          await layer.updateRender(this.pdfDocument, this.page, layerElement, options);
        } else {
          await layer.render(this.pdfDocument, this.page, layerElement, options);
        }
      }
      layerIndex++;
    }
  }
}

export class LayerPlugin extends BasePlugin<LayerPluginConfig, LayerCapability> {
  private layers: Map<string, ILayerPlugin> = new Map();

  constructor(
    public readonly id: string,
    registry: PluginRegistry,
    private _engine: PdfEngine
  ) {
    super(id, registry);
  }

  protected buildCapability(): LayerCapability {
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
        create: (registry, engine, config) => {
          // Layer plugin creation logic
          const layerPlugin = layer.package.create(registry, engine, config);
          this.addLayer(layerPlugin);
          return layerPlugin;
        },
        reducer: layer.package.reducer,
        initialState: layer.package.initialState
      }, layer.config);
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
  ): Promise<LayerController> {
    // Get page and validate
    const page = pdfDocument.pages[pageIndex];
    if (!page) {
      throw new Error(`Page index ${pageIndex} not found in document ${pdfDocument.id}`);
    }
    
    // Ensure options has default values and topic
    const renderOptions: LayerRenderOptions = {
      scale: options.scale || 1,
      rotation: options.rotation || 0,
      topic: options.topic || 'default'
    };

    // Create or find layers container
    const layersContainer = this.createOrUpdateLayersContainer(container, page, renderOptions);
    
    // Create and render layer elements
    const layerElements = await this.createAndRenderLayerElements(
      pdfDocument, 
      page, 
      layersContainer, 
      renderOptions
    );
    
    // Return controller for this render
    return new LayerControllerImpl(
      pdfDocument,
      page,
      layersContainer,
      renderOptions,
      this.layers,
      layerElements
    );
  }
  
  /**
   * Create or update the container for all layers
   */
  private createOrUpdateLayersContainer(
    container: HTMLElement, 
    page: PdfPageObject, 
    options: LayerRenderOptions
  ): HTMLElement {
    const transformedSize = transformSize(page.size, options.rotation, 1);
    
    // Create or reuse container
    let layersContainer: HTMLElement;
    const existingContainer = container.querySelector('.pdf-layers-container') as HTMLElement;
    
    if (existingContainer) {
      layersContainer = existingContainer;
      // Clear existing content
      while (layersContainer.firstChild) {
        layersContainer.removeChild(layersContainer.firstChild);
      }
    } else {
      layersContainer = document.createElement('div');
      layersContainer.className = 'pdf-layers-container';
      layersContainer.style.position = 'relative';
      layersContainer.style.transform = 'translate3d(0,0,0)';
      container.appendChild(layersContainer);
    }
    
    // Set container styles
    layersContainer.style.setProperty('--page-scale-factor', `var(--scale-factor, ${options.scale})`);
    layersContainer.style.width = `round(down, var(--page-scale-factor) * ${transformedSize.width}px, 1px)`;
    layersContainer.style.height = `round(down, var(--page-scale-factor) * ${transformedSize.height}px, 1px)`;
    
    return layersContainer;
  }
  
  /**
   * Create and render individual layer elements
   */
  private async createAndRenderLayerElements(
    pdfDocument: PdfDocumentObject, 
    page: PdfPageObject, 
    container: HTMLElement, 
    options: LayerRenderOptions
  ): Promise<HTMLElement[]> {
    const layerElements: HTMLElement[] = [];
    
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
      container.appendChild(layerElement);
      layerElements.push(layerElement);

      await layer.render(pdfDocument, page, layerElement, options);
    }
    
    return layerElements;
  }

  async destroy(): Promise<void> {
    // Cleanup all layers
    for (const layer of this.layers.values()) {
      await layer?.destroy?.();
    }
    this.layers.clear();
  }
} 