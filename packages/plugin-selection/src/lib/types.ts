import { BasePluginConfig } from '@embedpdf/core';
import { PdfGlyphObject } from '@embedpdf/models';

/**
 * A contiguous run of glyphs within a single page.
 *
 * `start` and `end` are **glyph indexes** (0-based, inclusive) as delivered
 * by `PdfEngine.getPageGlyphs(pageIndex)`.
 *
 * • `start <= end` is guaranteed.  
 * • They always refer to the same page; the pageIndex is carried
 *   separately (e.g. in `{ pageIndex, range }` objects inside plugin state).
 */
export interface SelectionRange {
  /** Index of the first glyph in the range (inclusive) */
  start: number;

  /** Index of the last glyph in the range (inclusive) */
  end: number;
}

export interface Selection {
  pageIndex: number;
  range: SelectionRange | null;
}

export interface SelectionPluginConfig extends BasePluginConfig {}

export interface SelectionState {
  /** page → glyph list */
  glyphCache: Record<number, PdfGlyphObject[]>;
  /** currently highlighted range */
  selection: Selection | null;
}

export interface SelectionCapability {
  /** fetch (or cache) all glyphs on a page */
  getPageGlyphs(pageIndex: number): Promise<PdfGlyphObject[]>;
  /** listen to selection updates */
  onSelectionChange(
    handler: (s: SelectionState['selection']) => void,
  ): () => void;
  /** set programmatically */
  setSelection(pageIndex: number, range: SelectionRange | null): void;
}
