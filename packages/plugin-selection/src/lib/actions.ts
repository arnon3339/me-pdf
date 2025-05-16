import { Action } from '@embedpdf/core';
import { PdfGlyphObject } from '@embedpdf/models';
import { SelectionRange } from './types';

/* ── glyph cache ──────────────────────────────────────────── */
export const SET_PAGE_GLYPHS = 'SET_PAGE_GLYPHS';
export interface SetPageGlyphsAction extends Action {
  type: typeof SET_PAGE_GLYPHS;
  payload: { pageIndex: number; glyphs: PdfGlyphObject[] };
}

/* ── user selection ───────────────────────────────────────── */
export const SET_ACTIVE_SELECTION = 'SET_ACTIVE_SELECTION';
export interface SetActiveSelectionAction extends Action {
  type: typeof SET_ACTIVE_SELECTION;
  payload: { pageIndex: number; range: SelectionRange | null };
}

export type SelectionAction =
  | SetPageGlyphsAction
  | SetActiveSelectionAction;

/* helpers */
export const setPageGlyphs = (
  pageIndex: number,
  glyphs: PdfGlyphObject[],
): SetPageGlyphsAction => ({
  type: SET_PAGE_GLYPHS,
  payload: { pageIndex, glyphs },
});

export const setActiveSelection = (
  pageIndex: number,
  range: SelectionRange | null,
): SetActiveSelectionAction => ({
  type: SET_ACTIVE_SELECTION,
  payload: { pageIndex, range },
});