import { BasePlugin, PluginRegistry } from "@embedpdf/core";
import { PdfPageObject } from "@embedpdf/models";
import { SpreadCapability, SpreadMode, SpreadPluginConfig, SpreadState } from "./types";

export class SpreadPlugin extends BasePlugin<SpreadPluginConfig, SpreadState> {
  private spreadHandlers: ((spreadMode: SpreadMode) => void)[] = [];

  constructor(
    public readonly id: string,
    registry: PluginRegistry,
  ) {
    super(id, registry, {
      spreadMode: SpreadMode.None
    });
  }

  async initialize(config: SpreadPluginConfig): Promise<void> {
    this.updateState({
      spreadMode: config.defaultSpreadMode || SpreadMode.None
    });
  }

  getSpreadPagesObjects(pages: PdfPageObject[]): PdfPageObject[][] {
    if (!pages.length) return [];
    
    switch (this.state.spreadMode) {
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
    if (this.state.spreadMode !== mode) {
      this.updateState({
        spreadMode: mode
      });
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
      getSpreadMode: () => this.state.spreadMode,
      getSpreadPagesObjects: (pages) => this.getSpreadPagesObjects(pages),
    };
  }

  async destroy(): Promise<void> {
    this.spreadHandlers = [];
  }
}