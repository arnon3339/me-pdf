import { BasePluginConfig, IPlugin, PluginRegistry } from "@embedpdf/core";
import { PdfDocumentObject } from "@embedpdf/models";
import { LoaderCapability, LoaderPlugin } from "@embedpdf/plugin-loader";
import { SpreadCapability, SpreadMetrics, SpreadPlugin } from "@embedpdf/plugin-spread";
import { ViewportCapability, ViewportMetrics, ViewportPlugin } from "@embedpdf/plugin-viewport";
import { ScrollMetrics, ScrollStrategy } from "./types";
import { VerticalScrollStrategy } from "./strategies/vertical-strategy";
import { HorizontalScrollStrategy } from "./strategies/horizontal-strategy";

export interface ScrollPluginConfig extends BasePluginConfig {
  strategy?: ScrollStrategy;
}

export interface ScrollCapability {
  onScroll(handler: (metrics: ScrollMetrics) => void): void;
  scrollToPage(pageNumber: number): void;
  //getCurrentMetrics(): ScrollMetrics;
}

export class ScrollPlugin implements IPlugin<ScrollPluginConfig> {
  private viewport: ViewportCapability;
  private loader: LoaderCapability;
  private spread: SpreadCapability;
  private strategy: VerticalScrollStrategy | HorizontalScrollStrategy;
  private scrollHandlers: ((metrics: ScrollMetrics) => void)[] = [];

  constructor(
    public readonly id: string,
    private registry: PluginRegistry,
  ) {
    this.viewport = this.registry.getPlugin<ViewportPlugin>('viewport').provides();
    this.loader = this.registry.getPlugin<LoaderPlugin>('loader').provides();
    this.spread = this.registry.getPlugin<SpreadPlugin>('spread').provides();
    
    this.strategy = new HorizontalScrollStrategy(this.viewport);
    
    this.loader.onDocumentLoaded(this.handleDocumentLoad.bind(this));
    this.viewport.onViewportChange(this.handleViewportChange.bind(this), { mode: 'throttle', wait: 250 });
    this.spread.onSpreadChange(this.handleSpreadChange.bind(this));
  }

  private handleDocumentLoad(doc: PdfDocumentObject): void {
    this.strategy.setPages(doc.pages);
    this.strategy.calculateDimensions(this.spread.getCurrentMetrics());

    // Trigger initial viewport update to render virtual items
    this.strategy.handleScroll(this.viewport.getMetrics());
  }

  private handleViewportChange(metrics: ViewportMetrics): void {
    this.strategy.handleScroll(metrics);
  }

  private handleSpreadChange(spreadMetrics: SpreadMetrics): void {
    this.strategy.updateLayout(spreadMetrics);
  }

  provides(): ScrollCapability {
    return {
      onScroll: (handler) => this.scrollHandlers.push(handler),
      scrollToPage: (pageNumber) => this.strategy.scrollToPage(pageNumber),
      //getCurrentMetrics: () => this.strategy.getVirtualItems()[0]
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