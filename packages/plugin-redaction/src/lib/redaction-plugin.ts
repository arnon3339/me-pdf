import { RedactionPluginConfig, RedactionCapability } from './types';
import { BasePlugin, PluginRegistry } from '@embedpdf/core';
import { PdfEngine, PdfErrorCode, PdfTaskHelper } from '@embedpdf/models';
import { SelectionCapability, SelectionPlugin } from '@embedpdf/plugin-selection';

export class RedactionPlugin extends BasePlugin<RedactionPluginConfig, RedactionCapability> {
  static readonly id = 'redaction' as const;
  private engine: PdfEngine;

  private selection: SelectionCapability;

  constructor(id: string, registry: PluginRegistry, engine: PdfEngine) {
    super(id, registry);
    this.engine = engine;

    this.selection = this.registry.getPlugin<SelectionPlugin>('selection')!.provides();
  }

  async initialize(_config: RedactionPluginConfig): Promise<void> {}

  protected buildCapability(): RedactionCapability {
    return {
      redactCurrentSelection: () => this.redactCurrentSelection(),
    };
  }

  private redactCurrentSelection() {
    const doc = this.coreState.core.document;
    if (!doc)
      return PdfTaskHelper.reject({ code: PdfErrorCode.NotFound, message: 'Doc not found' });

    const formattedSelection = this.selection.getFormattedSelection();

    for (const selection of formattedSelection) {
      const page = this.coreState.core.document?.pages[selection.pageIndex];
      if (!page)
        return PdfTaskHelper.reject({ code: PdfErrorCode.NotFound, message: 'Page not found' });

      const rects = selection.segmentRects;
      return this.engine.redactTextInRects(doc, page, rects, true);
    }
    return PdfTaskHelper.resolve(true);
  }
}
