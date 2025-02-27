import { IPlugin, PluginRegistry } from "@embedpdf/core";
import { PdfDocumentObject, PdfPageObject } from "@embedpdf/models";
import { LoaderCapability, LoaderPlugin } from "@embedpdf/plugin-loader";
import { SpreadCapability, SpreadPlugin, SpreadMode } from "@embedpdf/plugin-spread";
import { LayerCapability, LayerPlugin } from "@embedpdf/plugin-layer";

import { PageManagerCapability, PageManagerPluginConfig } from "./types";

export class PageManagerPlugin implements IPlugin<PageManagerPluginConfig> {
  private loader: LoaderCapability;
  private spread: SpreadCapability;
  private layer: LayerCapability;

  private pagesChangeHandlers: ((pages: PdfPageObject[][]) => void)[] = [];
  private pageManagerInitializedHandlers: ((pages: PdfPageObject[][]) => void)[] = [];

  private pages: PdfPageObject[] = [];
  private spreadPages: PdfPageObject[][] = [];
  private pageGap: number = 20;
  private pageElements: Map<number, HTMLElement> = new Map();

  constructor(
    public readonly id: string,
    private registry: PluginRegistry,
  ) {
    this.loader = this.registry.getPlugin<LoaderPlugin>('loader').provides();
    this.spread = this.registry.getPlugin<SpreadPlugin>('spread').provides();
    this.layer = this.registry.getPlugin<LayerPlugin>('layer').provides();

    // Listen for document loading
    this.loader.onDocumentLoaded(this.handleDocumentLoaded.bind(this));
    this.spread.onSpreadChange(this.handleSpreadChange.bind(this));
  }

  provides(): PageManagerCapability {
    return {
      onPagesChange: (handler) => this.pagesChangeHandlers.push(handler),
      onPageManagerInitialized: (handler) => this.pageManagerInitializedHandlers.push(handler),
      getPages: () => this.pages,
      getSpreadPages: () => this.spreadPages,
      getPageGap: () => this.pageGap,
      createPageElement: this.createPageElement.bind(this)
    };
  }

  async initialize(config: PageManagerPluginConfig): Promise<void> {
    if (config.pageGap !== undefined) {
      this.pageGap = config.pageGap;
    }
  }

  createPageElement(page: PdfPageObject, pageNum: number): HTMLElement {
    // Check if we already have a cached element for this page
    if (this.pageElements.has(pageNum)) {
      return this.pageElements.get(pageNum)!;
    }

    console.log('createPageElement', page, pageNum);
    
    const pageElement = document.createElement('div');
    
    pageElement.dataset.pageNumber = pageNum.toString();
    pageElement.style.width = `round(down, var(--scale-factor) * ${page.size.width}px, 1px)`;
    pageElement.style.height = `round(down, var(--scale-factor) * ${page.size.height}px, 1px)`;
    pageElement.style.backgroundColor = 'red';
    pageElement.style.display = 'flex';
    pageElement.style.alignItems = 'center';
    pageElement.style.justifyContent = 'center';
    
    const pageNumberElement = document.createElement('span');
    pageNumberElement.textContent = `Page ${pageNum}`;
    pageNumberElement.style.fontSize = '30px';
    pageNumberElement.style.color = 'white';
    pageElement.appendChild(pageNumberElement);
    
    // Cache the element for future use
    this.pageElements.set(pageNum, pageElement);
    
    return pageElement;
  }

  private handleDocumentLoaded(document: PdfDocumentObject): void {
    this.pages = document.pages;
    this.spreadPages = this.spread.getSpreadPagesObjects(this.pages);
    this.notifyPageManagerInitialized();
  }

  private handleSpreadChange(_spreadMode: SpreadMode): void {
    this.spreadPages = this.spread.getSpreadPagesObjects(this.pages);
    this.notifyPagesChange();
  }

  private notifyPagesChange(): void {
    this.pagesChangeHandlers.forEach(handler => handler(this.spreadPages));
  }

  private notifyPageManagerInitialized(): void {
    this.pageManagerInitializedHandlers.forEach(handler => handler(this.spreadPages));
  }

  async destroy(): Promise<void> {
    this.pageElements.clear();
  }
}