import { IPlugin, PluginRegistry } from "@embedpdf/core";
import { PdfPageObject } from "@embedpdf/models";
import { ViewportCapability, ViewportMetrics, ViewportPlugin } from "@embedpdf/plugin-viewport";
import { ScrollCapability, ScrollMetrics, ScrollPluginConfig, ScrollStrategy } from "./types";
import { VerticalScrollStrategy } from "./strategies/vertical-strategy";
import { HorizontalScrollStrategy } from "./strategies/horizontal-strategy";
import { PageManagerCapability, PageManagerPlugin } from "@embedpdf/plugin-page-manager";
import { ScrollStrategyConfig } from "./strategies/base-strategy";

export class ScrollPlugin implements IPlugin<ScrollPluginConfig> {
  private viewport: ViewportCapability;
  private pageManager: PageManagerCapability;
  private strategy: VerticalScrollStrategy | HorizontalScrollStrategy;
  private scrollHandlers: ((metrics: ScrollMetrics) => void)[] = [];
  private scrollReadyHandlers: (() => void)[] = [];
  private pageChangeHandlers: ((pageNumber: number) => void)[] = [];
  private currentZoom: number = 1;
  private currentPage: number = 1;
  private initialPage: number | undefined;

  constructor(
    public readonly id: string,
    private registry: PluginRegistry,
    private config?: ScrollPluginConfig
  ) {
    this.viewport = this.registry.getPlugin<ViewportPlugin>('viewport').provides();
    this.pageManager = this.registry.getPlugin<PageManagerPlugin>('page-manager').provides();
    
    this.currentZoom = parseFloat(this.viewport.getContainer().style.getPropertyValue('--scale-factor') || '1');

    const strategyConfig: ScrollStrategyConfig = {
      createPageElement: (page, pageNum) => this.pageManager.createPageElement(page, pageNum),
      getScaleFactor: () => this.currentZoom,
      pageGap: this.pageManager.getPageGap(),
      viewportGap: this.viewport.getViewportGap(),
      bufferSize: this.config?.bufferSize ?? 2
    };

    // Choose strategy based on config
    if (this.config?.strategy === ScrollStrategy.Horizontal) {
      this.strategy = new HorizontalScrollStrategy(strategyConfig);
    } else {
      // Default to vertical scrolling
      this.strategy = new VerticalScrollStrategy(strategyConfig);
    }

    if(this.config?.initialPage) {
      this.initialPage = this.config.initialPage;
    }
    
    this.viewport.onViewportChange(this.handleViewportChange.bind(this), { mode: 'throttle', wait: 250 });
    this.viewport.onContainerChange(this.handleContainerChange.bind(this));
    this.pageManager.onPagesChange(this.handlePageSpreadChange.bind(this));
    this.pageManager.onPageManagerInitialized(this.handlePageManagerInitialized.bind(this));
  }

  private handlePageManagerInitialized(pdfPageObject: PdfPageObject[][] ): void {
    this.strategy.calculateDimensions(pdfPageObject);

    // Trigger initial viewport update to render virtual items
    this.strategy.handleScroll(this.viewport.getMetrics());

    if(this.initialPage) {
      this.strategy.scrollToPage(this.initialPage, 'instant');
    }

    this.scrollReadyHandlers.forEach(handler => handler());
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
    const scrollMetrics = this.strategy.handleScroll(metrics);
    this.handleScrollMetricsChange(scrollMetrics);
  }

  private handlePageSpreadChange(pdfPageObject: PdfPageObject[][]): void {
    const metrics = this.viewport.getMetrics();
    const scrollMetrics = this.strategy.updateLayout(metrics, pdfPageObject);
    this.handleScrollMetricsChange(scrollMetrics);
  }

  private getMetrics(viewport?: ViewportMetrics): ScrollMetrics {
    if (!viewport) {
      viewport = this.viewport.getMetrics();
    }

    return this.strategy.handleScroll(viewport);
  }

  private handleScrollMetricsChange(scrollMetrics: ScrollMetrics): void {
    this.scrollHandlers.forEach(handler => handler(scrollMetrics));
    this.pageManager.updateVisiblePages({
      visiblePages: scrollMetrics.visiblePages, 
      currentPage: scrollMetrics.currentPage,
      renderedPageIndexes: scrollMetrics.renderedPageIndexes
    });

    this.handlePageChange(scrollMetrics);
  }

  private handlePageChange(scrollMetrics: ScrollMetrics): void {
    if (this.currentPage !== scrollMetrics.currentPage) {
      this.pageChangeHandlers.forEach(handler => handler(scrollMetrics.currentPage));
      this.currentPage = scrollMetrics.currentPage;
    }
  }

  provides(): ScrollCapability {
    return {
      onScroll: (handler) => this.scrollHandlers.push(handler),
      onPageChange: (handler) => this.pageChangeHandlers.push(handler),
      scrollToPage: (pageNumber, behavior = 'smooth') => this.strategy.scrollToPage(pageNumber, behavior),
      scrollToNextPage: (behavior = 'smooth') => this.strategy.scrollToNextPage(behavior),
      scrollToPreviousPage: (behavior = 'smooth') => this.strategy.scrollToPreviousPage(behavior),
      getMetrics: (viewport?: ViewportMetrics) => this.getMetrics(viewport),
      onScrollReady: (handler) => this.scrollReadyHandlers.push(handler),
    };
  }

  async initialize(): Promise<void> {
    const container = this.viewport.getContainer();
    const innerDiv = this.viewport.getInnerDiv();
    this.strategy.initialize(container, innerDiv);
  }

  async destroy(): Promise<void> {
    this.strategy.destroy();
    this.scrollHandlers = [];
    this.scrollReadyHandlers = [];
  }
}