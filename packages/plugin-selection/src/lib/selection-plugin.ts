import {
  BasePlugin,
  PluginRegistry,
  REFRESH_PAGES,
  SET_DOCUMENT,
  Unsubscribe,
  createBehaviorEmitter,
  createEmitter,
} from '@embedpdf/core';
import {
  PdfEngine,
  PdfPageGeometry,
  Rect,
  PdfTask,
  PdfTaskHelper,
  PdfErrorCode,
  ignore,
  PageTextSlice,
  Task,
} from '@embedpdf/models';

import {
  cachePageGeometry,
  setSelection,
  SelectionAction,
  endSelection,
  startSelection,
  clearSelection,
  reset,
  setRects,
  setSlices,
} from './actions';
import * as selector from './selectors';
import {
  SelectionCapability,
  SelectionPluginConfig,
  SelectionRangeX,
  SelectionState,
} from './types';
import { sliceBounds, rectsWithinSlice } from './utils';

export class SelectionPlugin extends BasePlugin<
  SelectionPluginConfig,
  SelectionCapability,
  SelectionState,
  SelectionAction
> {
  static readonly id = 'selection' as const;

  /** Modes that should trigger text-selection logic */
  private enabledModes = new Set<string>(['pointerMode']);

  /* interactive state */
  private selecting = false;
  private anchor?: { page: number; index: number };

  private readonly selChange$ = createBehaviorEmitter<SelectionState['selection']>();
  private readonly textRetrieved$ = createBehaviorEmitter<string[]>();
  private readonly copyToClipboard$ = createEmitter<string>();
  private readonly beginSelection$ = createEmitter<{ page: number; index: number }>();
  private readonly endSelection$ = createEmitter<void>();
  private readonly refreshPages$ = createEmitter<number[]>();

  constructor(
    id: string,
    registry: PluginRegistry,
    private engine: PdfEngine,
  ) {
    super(id, registry);

    this.coreStore.onAction(SET_DOCUMENT, (_action) => {
      this.dispatch(reset());
    });

    this.coreStore.onAction(REFRESH_PAGES, (action) => {
      const tasks = action.payload.map((pageIdx) => this.getNewPageGeometryAndCache(pageIdx));
      Task.all(tasks).wait(() => {
        this.refreshPages$.emit(action.payload);
      }, ignore);
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
      getFormattedSelection: () => selector.getFormattedSelection(this.state),
      getFormattedSelectionForPage: (p) => selector.getFormattedSelectionForPage(this.state, p),
      getHighlightRectsForPage: (p) => selector.selectRectsForPage(this.state, p),
      getHighlightRects: () => this.state.rects,
      getBoundingRectForPage: (p) => selector.selectBoundingRectForPage(this.state, p),
      getBoundingRects: () => selector.selectBoundingRectsForAllPages(this.state),
      begin: (p, i) => this.beginSelection(p, i),
      update: (p, i) => this.updateSelection(p, i),
      end: () => this.endSelection(),
      clear: () => this.clearSelection(),
      onCopyToClipboard: this.copyToClipboard$.on,
      onSelectionChange: this.selChange$.on,
      onTextRetrieved: this.textRetrieved$.on,
      onBeginSelection: this.beginSelection$.on,
      onEndSelection: this.endSelection$.on,
      getSelectedText: () => this.getSelectedText(),
      copyToClipboard: () => this.copyToClipboard(),
      enableForMode: (id: string) => this.enabledModes.add(id),
      isEnabledForMode: (id: string) => this.enabledModes.has(id),
      getState: () => this.state,
    };
  }

  public onRefreshPages(fn: (pages: number[]) => void): Unsubscribe {
    return this.refreshPages$.on(fn);
  }

  private getNewPageGeometryAndCache(pageIdx: number): PdfTask<PdfPageGeometry> {
    if (!this.coreState.core.document)
      return PdfTaskHelper.reject({ code: PdfErrorCode.NotFound, message: 'Doc Not Found' });
    const page = this.coreState.core.document.pages.find((p) => p.index === pageIdx)!;
    const task = this.engine.getPageGeometry(this.coreState.core.document, page);
    task.wait((geo) => {
      this.dispatch(cachePageGeometry(pageIdx, geo));
    }, ignore);
    return task;
  }

  /* ── geometry cache ───────────────────────────────────── */
  private getOrLoadGeometry(pageIdx: number): PdfTask<PdfPageGeometry> {
    const cached = this.state.geometry[pageIdx];
    if (cached) return PdfTaskHelper.resolve(cached);

    return this.getNewPageGeometryAndCache(pageIdx);
  }

  /* ── selection state updates ───────────────────────────── */
  private beginSelection(page: number, index: number) {
    this.selecting = true;
    this.anchor = { page, index };
    this.dispatch(startSelection());
    this.beginSelection$.emit({ page, index });
  }

  private endSelection() {
    this.selecting = false;
    this.anchor = undefined;
    this.dispatch(endSelection());
    this.endSelection$.emit();
  }

  private clearSelection() {
    this.selecting = false;
    this.anchor = undefined;
    this.dispatch(clearSelection());
    this.selChange$.emit(null);
  }

  private updateSelection(page: number, index: number) {
    if (!this.selecting || !this.anchor) return;

    const a = this.anchor;
    const forward = page > a.page || (page === a.page && index >= a.index);

    const start = forward ? a : { page, index };
    const end = forward ? { page, index } : a;

    const range = { start, end };
    this.dispatch(setSelection(range));
    this.updateRectsAndSlices(range);
    this.selChange$.emit(range);
  }

  private updateRectsAndSlices(range: SelectionRangeX) {
    const allRects: Record<number, Rect[]> = {};
    const allSlices: Record<number, { start: number; count: number }> = {};

    for (let p = range.start.page; p <= range.end.page; p++) {
      const geo = this.state.geometry[p];
      const sb = sliceBounds(range, geo, p);
      if (!sb) continue;

      allRects[p] = rectsWithinSlice(geo!, sb.from, sb.to);
      allSlices[p] = { start: sb.from, count: sb.to - sb.from + 1 };
    }

    this.dispatch(setRects(allRects));
    this.dispatch(setSlices(allSlices));
  }

  private getSelectedText(): PdfTask<string[]> {
    if (!this.coreState.core.document || !this.state.selection) {
      return PdfTaskHelper.reject({
        code: PdfErrorCode.NotFound,
        message: 'Doc Not Found or No Selection',
      });
    }

    const sel = this.state.selection;
    const req: PageTextSlice[] = [];

    for (let p = sel.start.page; p <= sel.end.page; p++) {
      const s = this.state.slices[p];
      if (s) req.push({ pageIndex: p, charIndex: s.start, charCount: s.count });
    }

    if (req.length === 0) return PdfTaskHelper.resolve([] as string[]);

    const task = this.engine.getTextSlices(this.coreState.core.document, req);

    // Emit the text when it's retrieved
    task.wait((text) => {
      this.textRetrieved$.emit(text);
    }, ignore);

    return task;
  }

  private copyToClipboard() {
    const text = this.getSelectedText();
    text.wait((text) => {
      this.copyToClipboard$.emit(text.join('\n'));
    }, ignore);
  }
}
