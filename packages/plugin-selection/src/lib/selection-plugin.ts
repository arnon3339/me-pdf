import { BasePlugin, PluginRegistry, SET_DOCUMENT } from '@embedpdf/core';
import {
  SelectionCapability,
  SelectionPluginConfig,
  SelectionRangeX,
  SelectionState,
} from './types';
import {
  cachePageGeometry,
  setSelection,
  SelectionAction,
  endSelection,
  startSelection,
  setRects,
  clearSelection,
  reset,
  setAllRects,
} from './actions';
import { PdfEngine, PdfDocumentObject, PdfPageGeometry, TaskError, Rect } from '@embedpdf/models';
import { createBehaviorEmitter } from '@embedpdf/core';
import * as selector from './selectors';

export class SelectionPlugin extends BasePlugin<
  SelectionPluginConfig,
  SelectionCapability,
  SelectionState,
  SelectionAction
> {
  static readonly id = 'selection' as const;
  private doc?: PdfDocumentObject;

  /* interactive state */
  private selecting = false;
  private anchor?: { page: number; index: number };

  private readonly selChange$ = createBehaviorEmitter<SelectionState['selection']>();

  constructor(
    id: string,
    registry: PluginRegistry,
    private engine: PdfEngine,
  ) {
    super(id, registry);

    this.coreStore.onAction(SET_DOCUMENT, (_action, state) => {
      this.dispatch(reset());
      this.doc = state.core.document ?? undefined;
    });
  }

  /* ── life-cycle ────────────────────────────────────────── */
  async initialize() {}
  async destroy() {
    this.selChange$.clear();
  }

  /* ── capability exposed to UI / other plugins ─────────── */
  buildCapability(): SelectionCapability {
    return {
      getGeometry: (p) => this.getOrLoadGeometry(p),
      getHighlightRects: (p) => selector.selectRectsForPage(this.state, p),
      getBoundingRect: (p) => selector.selectBoundingRectForPage(this.state, p),
      getBoundingRects: () => selector.selectBoundingRectsForAllPages(this.state),
      begin: (p, i) => this.beginSelection(p, i),
      update: (p, i) => this.updateSelection(p, i),
      end: () => this.endSelection(),
      clear: () => this.clearSelection(),

      onSelectionChange: this.selChange$.on,
    };
  }

  /* ── geometry cache ───────────────────────────────────── */
  private getOrLoadGeometry(pageIdx: number): Promise<PdfPageGeometry> {
    const cached = this.state.geometry[pageIdx];
    if (cached) return Promise.resolve(cached);

    if (!this.doc) return Promise.reject('doc closed');
    const page = this.doc.pages.find((p) => p.index === pageIdx)!;

    return new Promise((res, rej) => {
      this.engine.getPageGeometry(this.doc!, page).wait(
        (geo) => {
          this.dispatch(cachePageGeometry(pageIdx, geo));
          res(geo);
        },
        (e: TaskError<any>) => rej(e),
      );
    });
  }

  /* ── selection state updates ───────────────────────────── */
  private beginSelection(page: number, index: number) {
    this.selecting = true;
    this.anchor = { page, index };
    this.dispatch(startSelection());
  }

  private endSelection() {
    this.selecting = false;
    this.anchor = undefined;
    this.dispatch(endSelection());
  }

  private clearSelection() {
    this.selecting = false;
    this.anchor = undefined;
    this.dispatch(clearSelection());
    this.selChange$.emit(null);
  }

  private updateRectsForRange(range: SelectionRangeX) {
    const allRects: Record<number, Rect[]> = {};

    for (let p = range.start.page; p <= range.end.page; p++) {
      const rects = this.buildRectsForPage(p);
      if (rects.length > 0) {
        allRects[p] = rects;
      }
    }

    this.dispatch(setAllRects(allRects));
  }

  private updateSelection(page: number, index: number) {
    if (!this.selecting || !this.anchor) return;

    const a = this.anchor;
    const forward = page > a.page || (page === a.page && index >= a.index);

    const start = forward ? a : { page, index };
    const end = forward ? { page, index } : a;

    const range = { start, end };
    this.dispatch(setSelection(range));
    this.updateRectsForRange(range);
    this.selChange$.emit(range);
  }

  /* ── rect builder: 1 div per run slice ─────────────────── */
  private buildRectsForPage(page: number): Rect[] {
    const sel = this.state.selection;
    if (!sel) return [];

    /* page not covered by the current selection */
    if (page < sel.start.page || page > sel.end.page) return [];

    const geo = this.state.geometry[page];
    if (!geo) return [];

    const from = page === sel.start.page ? sel.start.index : 0;
    const to =
      page === sel.end.page
        ? sel.end.index
        : geo.runs[geo.runs.length - 1].charStart + geo.runs[geo.runs.length - 1].glyphs.length - 1;

    const rects = [];
    for (const run of geo.runs) {
      const runStart = run.charStart;
      const runEnd = runStart + run.glyphs.length - 1;
      if (runEnd < from || runStart > to) continue;

      const sIdx = Math.max(from, runStart) - runStart;
      const eIdx = Math.min(to, runEnd) - runStart;

      // Calculate bounds across all selected glyphs in this run
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      for (let i = sIdx; i <= eIdx; i++) {
        const glyph = run.glyphs[i];
        if (glyph.flags === 2) continue; // Skip empty glyphs

        minX = Math.min(minX, glyph.x);
        maxX = Math.max(maxX, glyph.x + glyph.width);
        minY = Math.min(minY, glyph.y);
        maxY = Math.max(maxY, glyph.y + glyph.height);
      }

      // Only add rect if we found valid bounds
      if (minX !== Infinity && minY !== Infinity) {
        rects.push({
          origin: { x: minX, y: minY },
          size: { width: maxX - minX, height: maxY - minY },
        });
      }
    }

    return rects;
  }
}
