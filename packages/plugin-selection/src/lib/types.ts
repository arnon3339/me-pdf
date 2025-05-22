import { BasePluginConfig } from '@embedpdf/core';
import { PdfPageGeometry } from '@embedpdf/models';

export interface SelectionPluginConfig extends BasePluginConfig {}

/* ---- user-selection cross-page -------------------------------------- */
export interface GlyphPointer {
  page: number;
  index: number;              // glyph index within that page
}

export interface SelectionRangeX {
  start: GlyphPointer;
  end:   GlyphPointer;        // inclusive
}

export interface SelectionState {
  /** page → geometry cache */
  geometry: Record<number, PdfPageGeometry>;
  /** current selection or null */
  selection: SelectionRangeX | null;
  active: boolean;
  selecting: boolean;
}

export interface SelectionCapability {
  /* geometry (cached) */
  getGeometry(page: number): Promise<PdfPageGeometry>;
  /* highlight rectangles for one page at given scale */
  getHighlightRects(page: number):
    { x: number; y: number; width: number; height: number; }[];
  /* imperative API used by framework layers */
  begin(page: number, glyphIdx: number): void;
  update(page: number, glyphIdx: number): void;
  end(): void;
  clear(): void;

  onSelectionChange(cb: (r: SelectionRangeX|null)=>void): ()=>void;
}
