import { BasePluginConfig, IPlugin, PluginRegistry } from "@embedpdf/core";
import { LoaderPlugin } from "@embedpdf/plugin-loader";
import { SpreadCapability, SpreadMetrics, SpreadMode, SpreadPluginConfig } from "./types";

export class SpreadPlugin implements IPlugin<SpreadPluginConfig> {
  private spreadHandlers: ((metrics: SpreadMetrics) => void)[] = [];
  private spreadMode: SpreadMode = SpreadMode.None;
  private totalPages: number = 0;
  private spreads: number[][] = [];

  constructor(
    public readonly id: string,
    private registry: PluginRegistry,
  ) {}

  async initialize(config: SpreadPluginConfig): Promise<void> {
    this.spreadMode = config.defaultSpreadMode || SpreadMode.None;
    
    const loader = this.registry.getPlugin<LoaderPlugin>('loader').provides();
    loader.onDocumentLoaded(doc => {
      this.totalPages = doc.pageCount;
      this.calculateSpreads();
      this.notifySpreadChange();
    });
  }

  private calculateSpreads(): void {
    this.spreads = [];
    const pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    switch (this.spreadMode) {
      case 'none':
        this.spreads = pages.map(page => [page]);
        break;

      case 'odd':
        // First create pairs
        for (let i = 0; i < pages.length; i += 2) {
          const spread = pages.slice(i, i + 2);
          this.spreads.push(spread);
        }
        break;

      case 'even':
        // First page alone, then pairs
        if (pages.length > 0) {
          this.spreads.push([1]);
          for (let i = 1; i < pages.length; i += 2) {
            const spread = pages.slice(i, i + 2);
            this.spreads.push(spread);
          }
        }
        break;
    }
  }

  provides(): SpreadCapability {
    return {
      onSpreadChange: (handler) => this.spreadHandlers.push(handler),
      getCurrentMetrics: () => this.createSpreadMetrics(),
      setSpreadMode: (mode) => this.setSpreadMode(mode),
      getSpreadMode: () => this.spreadMode
    };
  }

  private setSpreadMode(mode: SpreadMode): void {
    if (this.spreadMode !== mode) {
      this.spreadMode = mode;
      this.calculateSpreads();
      this.notifySpreadChange();
    }
  }

  private notifySpreadChange(): void {
    const metrics = this.createSpreadMetrics();
    this.spreadHandlers.forEach(handler => handler(metrics));
  }

  private createSpreadMetrics(): SpreadMetrics {
    return {
      getSpreadForPage: (pageNumber: number) => {
        // Find the spread that contains this page
        const spread = this.spreads.find(spread => spread.includes(pageNumber));
        return spread || [pageNumber];
      },
      getAllSpreads: () => [...this.spreads]
    };
  }

  async destroy(): Promise<void> {
    this.spreadHandlers = [];
    this.spreads = [];
  }
}