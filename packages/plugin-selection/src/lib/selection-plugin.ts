import { BasePlugin, CoreState, PluginRegistry, StoreState } from '@embedpdf/core';
import {
  SelectionCapability,
  SelectionPluginConfig,
  SelectionState,
} from './types';
import {
  setPageGlyphs,
  setActiveSelection,
  SelectionAction,
} from './actions';
import { PdfEngine, PdfDocumentObject, ignore, PdfGlyphObject } from '@embedpdf/models';

export class SelectionPlugin extends BasePlugin<
  SelectionPluginConfig,
  SelectionCapability,
  SelectionState,
  SelectionAction
> {
  static readonly id = 'selection' as const;
  private engine: PdfEngine;
  private doc?: PdfDocumentObject;

  constructor(
    id: string,
    registry: PluginRegistry,
    engine: PdfEngine,
    _config?: SelectionPluginConfig,
  ) {
    super(id, registry);
    this.engine = engine;
  }

  /* ── capability exposed to other plugins / UI ─────────── */
  buildCapability(): SelectionCapability {
    return {
      /** async glyph extraction (cached) */
      getPageGlyphs: (pageIndex) => this.getOrLoadGlyphs(pageIndex),
      /** subscribe to range changes */
      onSelectionChange: (handler) =>
        this.subscribe((_, s) => handler(s.selection)),
      /** programmatic change */
      setSelection: (pageIdx, range) =>
        this.dispatch(setActiveSelection(pageIdx, range)),
    };
  }

  /* ── called by framework when a doc is loaded ──────────── */
  async initialize(): Promise<void> {
  }

  protected onCoreStoreUpdated(oldState: StoreState<CoreState>, newState: StoreState<CoreState>): void {
    if (oldState.core.document !== newState.core.document) {
      this.doc = newState.core.document ?? undefined;
    }
  }

  destroy(): void {
    // nothing extra
  }

  /* ──────────────────────────────────────────────────────── */
  private getOrLoadGlyphs(pageIndex: number) {
    const promise = new Promise<PdfGlyphObject[]>((resolve, reject) => {
      const cache = this.getState().glyphCache[pageIndex];
      if (cache) {
        resolve(cache);
        return;
      }

      if (!this.doc) {
        reject(new Error('document not open'));
        return;
      }

      const page = this.doc.pages.find((p) => p.index === pageIndex)!;
      this.engine
        .getPageGlyphs(this.doc, page)
        .wait(
          (glyphs) => {
            this.dispatch(setPageGlyphs(pageIndex, glyphs));
            resolve(glyphs);
          },
          (error) => {
            reject(error);
          }
        );
    });

    return promise;
  }
}
