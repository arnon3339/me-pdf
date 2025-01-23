import { IPlugin, IPDFCore } from '@cloudpdf/core';
import { PdfPageObject } from '@cloudpdf/models';
import { PageContainer } from '@cloudpdf/core';
import { ILayer } from './types';

export class LayerPlugin implements IPlugin {
  readonly name = 'layers';
  readonly version = '1.0.0';
  
  private core?: IPDFCore;
  private layers: Map<string, ILayer> = new Map();
  private pageContainers: Map<number, PageContainer> = new Map();
  private layerContainers: Map<number, Map<string, HTMLElement>> = new Map();

  constructor() {}

  async initialize(core: IPDFCore): Promise<void> {
    this.core = core;
  }

  // Standalone page rendering
  renderPage(page: PdfPageObject, container?: HTMLElement): PageContainer {
    const pageContainer = new PageContainer({ page, container });
    const pageNumber = page.index + 1;
    
    // Store the page container
    this.pageContainers.set(pageNumber, pageContainer);
    
    // Create and store layer containers
    this.createLayerContainers(pageNumber, pageContainer.element);
    
    // Render all layers
    this.renderPageLayers(pageNumber);
    
    return pageContainer;
  }

  private createLayerContainers(pageNumber: number, pageElement: HTMLElement) {
    const layerContainers = new Map<string, HTMLElement>();
    
    // Create containers for each layer
    for (const [id, layer] of this.layers) {
      const layerContainer = document.createElement('div');
      layerContainer.className = `pdf-layer pdf-layer-${id}`;
      layerContainer.style.position = 'absolute';
      layerContainer.style.top = '0';
      layerContainer.style.left = '0';
      layerContainer.style.width = '100%';
      layerContainer.style.height = '100%';
      layerContainer.style.zIndex = layer.zIndex.toString();
      
      pageElement.appendChild(layerContainer);
      layerContainers.set(id, layerContainer);
    }
    
    this.layerContainers.set(pageNumber, layerContainers);
  }

  private async renderPageLayers(pageNumber: number) {
    const layerContainers = this.layerContainers.get(pageNumber);
    const pageContainer = this.pageContainers.get(pageNumber);
    
    if (!layerContainers || !pageContainer) return;

    // Render each layer
    for (const [id, layer] of this.layers) {
      const container = layerContainers.get(id);
      if (container) {
        await layer.render(pageContainer.page, container);
      }
    }
  }

  async registerLayer(layer: ILayer): Promise<void> {
    this.layers.set(layer.id, layer);
    
    // Re-render all existing pages with the new layer
    for (const [pageNumber] of this.pageContainers) {
      await this.renderPageLayers(pageNumber);
    }
  }

  async destroy(): Promise<void> {
    // Cleanup all layers
    for (const layer of this.layers.values()) {
      await layer.destroy();
    }
    this.layers.clear();
    this.pageContainers.clear();
    this.layerContainers.clear();
  }

  getState() {
    return {};
  }

  setState() {
    // State updates would go here
  }
}