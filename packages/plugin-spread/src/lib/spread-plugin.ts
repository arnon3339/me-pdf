import { BasePlugin, PluginRegistry } from '@embedpdf/core';
import { PdfPageObject } from '@embedpdf/models';
import { SpreadCapability, SpreadMode, SpreadPluginConfig, SpreadState } from './types';
import { setSpreadMode } from './actions';
import { SpreadAction } from './actions';

export class SpreadPlugin extends BasePlugin<SpreadPluginConfig, SpreadState, SpreadAction> {
  private spreadHandlers: ((spreadMode: SpreadMode) => void)[] = [];

  constructor(id: string, registry: PluginRegistry) {
    super(id, registry);
  }

  async initialize(config: SpreadPluginConfig): Promise<void> {
    if(config.defaultSpreadMode) {
      this.dispatch(setSpreadMode(config.defaultSpreadMode));
    }
  }

  getSpreadPagesObjects(pages: PdfPageObject[]): PdfPageObject[][] {
    const state = this.getState();
    if (!pages.length) return [];

    switch (state.spreadMode) {
      case SpreadMode.None:
        return pages.map((page) => [page]);

      case SpreadMode.Odd:
        return Array.from({ length: Math.ceil(pages.length / 2) }, (_, i) =>
          pages.slice(i * 2, i * 2 + 2)
        );

      case SpreadMode.Even:
        return [
          [pages[0]],
          ...Array.from({ length: Math.ceil((pages.length - 1) / 2) }, (_, i) =>
            pages.slice(1 + i * 2, 1 + i * 2 + 2)
          ),
        ];

      default:
        return pages.map((page) => [page]);
    }
  }

  setSpreadMode(mode: SpreadMode): void {
    const currentMode = this.getState().spreadMode;
    if (currentMode !== mode) {
      this.dispatch(setSpreadMode(mode));
      this.notifySpreadChange(mode);
    }
  }

  private notifySpreadChange(spreadMode: SpreadMode): void {
    this.spreadHandlers.forEach((handler) => handler(spreadMode));
  }

  provides(): SpreadCapability {
    return {
      onSpreadChange: (handler) => this.spreadHandlers.push(handler),
      setSpreadMode: (mode) => this.setSpreadMode(mode),
      getSpreadMode: () => this.getState().spreadMode,
      getSpreadPagesObjects: (pages) => this.getSpreadPagesObjects(pages),
    };
  }

  async destroy(): Promise<void> {
    this.spreadHandlers = [];
  }
}