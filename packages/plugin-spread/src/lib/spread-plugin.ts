import { IPlugin, PluginRegistry } from "@embedpdf/core";
import { PdfPageObject } from "@embedpdf/models";
import { SpreadMode, SpreadPluginConfig, SpreadCapability } from "./types";

export class SpreadPlugin implements IPlugin<SpreadPluginConfig> {
  private spreadMode: SpreadMode = SpreadMode.None;
  private spreadHandlers: ((spreadMode: SpreadMode) => void)[] = [];

  constructor(
    public readonly id: string,
    private registry: PluginRegistry,
  ) {}

  async initialize(config: SpreadPluginConfig): Promise<void> {
    this.spreadMode = config.defaultSpreadMode || SpreadMode.None;
  }

  getSpreadPagesObjects(pages: PdfPageObject[]): PdfPageObject[][] {
    if (!pages.length) return [];
    
    switch (this.spreadMode) {
      case SpreadMode.None:
        return pages.map(page => [page]);
        
      case SpreadMode.Odd:
        return Array.from({ length: Math.ceil(pages.length / 2) }, (_, i) => 
          pages.slice(i * 2, (i * 2) + 2)
        );
        
      case SpreadMode.Even:
        return [
          [pages[0]],
          ...Array.from({ length: Math.ceil((pages.length - 1) / 2) }, (_, i) => 
            pages.slice(1 + (i * 2), 1 + (i * 2) + 2)
          )
        ];
        
      default:
        return pages.map(page => [page]);
    }
  }

  setSpreadMode(mode: SpreadMode): void {
    if (this.spreadMode !== mode) {
      this.spreadMode = mode;
      this.notifySpreadChange(mode);
    }
  }

  private notifySpreadChange(spreadMode: SpreadMode): void {
    this.spreadHandlers.forEach(handler => handler(spreadMode));
  }
 
  provides(): SpreadCapability {
    return {
      onSpreadChange: (handler) => this.spreadHandlers.push(handler),
      setSpreadMode: (mode) => this.setSpreadMode(mode),
      getSpreadMode: () => this.spreadMode,
      getSpreadPagesObjects: (pages) => this.getSpreadPagesObjects(pages),
    };
  }

  async destroy(): Promise<void> {
    this.spreadHandlers = [];
  }
}