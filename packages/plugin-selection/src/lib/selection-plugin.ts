import { BasePlugin, CoreState, PluginRegistry, StoreState } from '@embedpdf/core';
import {
  SelectionCapability,
  SelectionPluginConfig,
  SelectionState,
} from './types';
import {
  cachePageGeometry,
  setSelection,
  SelectionAction,
} from './actions';
import {
  PdfEngine,
  PdfDocumentObject,
  PdfPageGeometry,
  TaskError,
} from '@embedpdf/models';
import { createBehaviorEmitter } from '@embedpdf/core';

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

  private readonly selChange$ =
    createBehaviorEmitter<SelectionState['selection']>();

  constructor(
    id: string,
    registry: PluginRegistry,
    private engine: PdfEngine,
  ) {
    super(id, registry);
  }

  /* ── life-cycle ────────────────────────────────────────── */
  override onCoreStoreUpdated(_prevState: StoreState<CoreState>, newState: StoreState<CoreState>): void {
    this.doc = newState.core.document ?? undefined;
  }
  async initialize() {}
  async destroy() { this.selChange$.clear(); }

  /* ── capability exposed to UI / other plugins ─────────── */
  buildCapability(): SelectionCapability {
    return {
      getGeometry:        p   => this.getOrLoadGeometry(p),
      getHighlightRects: (p)=> this.buildRectsForPage(p),

      begin:   (p,i)=> this.beginSelection(p,i),
      update:  (p,i)=> this.updateSelection(p,i),
      end:     ()=>   { this.selecting = false; this.anchor = undefined; },
      clear:   ()=>   this.clearSelection(),

      onSelectionChange: this.selChange$.on,
    };
  }

  /* ── geometry cache ───────────────────────────────────── */
  private getOrLoadGeometry(pageIdx: number): Promise<PdfPageGeometry> {
    const cached = this.getState().geometry[pageIdx];
    if (cached) return Promise.resolve(cached);

    if (!this.doc) return Promise.reject('doc closed');
    const page = this.doc.pages.find(p => p.index === pageIdx)!;

    return new Promise((res, rej) => {
      this.engine.getPageGeometry(this.doc!, page).wait(
        geo => {
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
    this.anchor    = { page, index };
    this.dispatch(setSelection(null));
  }

  private clearSelection() {
    this.selecting = false;
    this.anchor    = undefined;
    this.dispatch(setSelection(null));
    this.selChange$.emit(null);
  }

  private updateSelection(page: number, index: number) {
    if (!this.selecting || !this.anchor) return;

    const a = this.anchor;
    const forward = (page > a.page) || (page === a.page && index >= a.index);

    const start = forward ? a               : { page, index };
    const end   = forward ? { page, index } : a;

    const range = { start, end };
    this.dispatch(setSelection(range));
    this.selChange$.emit(range);
  }

  /* ── rect builder: 1 div per run slice ─────────────────── */
  private buildRectsForPage(page: number) {
    const sel = this.getState().selection;
    if (!sel) return [];

    /* page not covered by the current selection */
    if (page < sel.start.page || page > sel.end.page) return [];

    const geo = this.getState().geometry[page];
    if (!geo) return [];

    const from = page === sel.start.page ? sel.start.index : 0;
    const to   = page === sel.end.page   ? sel.end.index   :
                 geo.runs[geo.runs.length - 1].charStart +
                 geo.runs[geo.runs.length - 1].glyphs.length - 1;

    const rects = [];
    for (const run of geo.runs) {
      const runStart = run.charStart;
      const runEnd   = runStart + run.glyphs.length - 1;
      if (runEnd < from || runStart > to) continue;

      const sIdx  = Math.max(from, runStart) - runStart;
      const eIdx  = Math.min(to,   runEnd  ) - runStart;
      const left  = run.glyphs[sIdx].x;
      const right = run.glyphs[eIdx].x + run.glyphs[eIdx].width;
      const top   = run.glyphs[sIdx].y;
      const bottom = run.glyphs[eIdx].y + run.glyphs[eIdx].height;

      rects.push({
        x:      left,
        y:      top,
        width:  (right - left),
        height: bottom - top
      });
    }
    return rects;
  }
}
