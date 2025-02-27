import { IPlugin, PluginRegistry } from "@embedpdf/core";
import { PdfPageObject } from "@embedpdf/models";
import { ViewportCapability, ViewportMetrics, ViewportPlugin } from "@embedpdf/plugin-viewport";
import { ScrollCapability, ScrollMetrics, ScrollPluginConfig, ScrollStrategy } from "./types";
import { VerticalScrollStrategy } from "./strategies/vertical-strategy";
import { HorizontalScrollStrategy } from "./strategies/horizontal-strategy";
import { PageManagerCapability, PageManagerPlugin } from "@embedpdf/plugin-page-manager";

export class ScrollPlugin implements IPlugin<ScrollPluginConfig> {
  private viewport: ViewportCapability;
  private pageManager: PageManagerCapability;
  private strategy: VerticalScrollStrategy | HorizontalScrollStrategy;
  private scrollHandlers: ((metrics: ScrollMetrics) => void)[] = [];
  private currentZoom: number = 1;

  constructor(
    public readonly id: string,
    private registry: PluginRegistry,
  ) {
    this.viewport = this.registry.getPlugin<ViewportPlugin>('viewport').provides();
    this.pageManager = this.registry.getPlugin<PageManagerPlugin>('page-manager').provides();
    
    this.currentZoom = parseFloat(this.viewport.getContainer().style.getPropertyValue('--scale-factor') || '1');

    this.strategy = new VerticalScrollStrategy({
      createPageElement: (page, pageNum) => this.pageManager.createPageElement(page, pageNum),
      getScaleFactor: () => this.currentZoom,
      pageGap: this.pageManager.getPageGap(),
    });
    
    this.viewport.onViewportChange(this.handleViewportChange.bind(this), { mode: 'throttle', wait: 250 });
    this.viewport.onContainerChange(this.handleContainerChange.bind(this));
    this.pageManager.onPagesChange(this.handlePageSpreadChange.bind(this));
    this.pageManager.onPageManagerInitialized(this.handlePageManagerInitialized.bind(this));
  }

  private handlePageManagerInitialized(pdfPageObject: PdfPageObject[][] ): void {
    this.strategy.calculateDimensions(pdfPageObject);

    // Trigger initial viewport update to render virtual items
    this.strategy.handleScroll(this.viewport.getMetrics());
  }

  private handleContainerChange(container: HTMLElement): void {
    const newZoom = parseFloat(container.style.getPropertyValue('--scale-factor') || '1');
    if (newZoom !== this.currentZoom) {
      this.currentZoom = newZoom;

      const metrics = this.viewport.getMetrics();
      this.strategy.handleScroll(metrics);
    }
  }

  private handleViewportChange(metrics: ViewportMetrics): void {
    this.strategy.handleScroll(metrics);
  }

  private handlePageSpreadChange(pdfPageObject: PdfPageObject[][]): void {
    const metrics = this.viewport.getMetrics();
    this.strategy.updateLayout(metrics, pdfPageObject);
  }

  provides(): ScrollCapability {
    return {
      onScroll: (handler) => this.scrollHandlers.push(handler),
      scrollToPage: (pageNumber) => this.strategy.scrollToPage(pageNumber)
    };
  }

  async initialize(config: ScrollPluginConfig): Promise<void> {
    const container = this.viewport.getContainer();
    this.strategy.initialize(container);
  }

  async destroy(): Promise<void> {
    this.strategy.destroy();
    this.scrollHandlers = [];
  }
}