import { PdfPageGeometry, Rect } from '@embedpdf/models';
import { SelectionRangeX } from './types';

/**
 * Hit-test helper using runs
 * @param geo - page geometry
 * @param pt - point
 * @returns glyph index
 */
export function glyphAt(geo: PdfPageGeometry, pt: { x: number; y: number }) {
  for (const run of geo.runs) {
    const inRun =
      pt.y >= run.rect.y &&
      pt.y <= run.rect.y + run.rect.height &&
      pt.x >= run.rect.x &&
      pt.x <= run.rect.x + run.rect.width;

    if (!inRun) continue;

    // Simply check if the point is within any glyph's bounding box
    const rel = run.glyphs.findIndex(
      (g) => pt.x >= g.x && pt.x <= g.x + g.width && pt.y >= g.y && pt.y <= g.y + g.height,
    );

    if (rel !== -1) {
      return run.charStart + rel;
    }
  }
  return -1;
}

/**
 * Helper: min/max glyph indices on `page` for current sel
 * @param sel - selection range
 * @param geo - page geometry
 * @param page - page index
 * @returns { from: number; to: number } | null
 */
export function sliceBounds(
  sel: SelectionRangeX | null,
  geo: PdfPageGeometry | undefined,
  page: number,
): { from: number; to: number } | null {
  if (!sel || !geo) return null;
  if (page < sel.start.page || page > sel.end.page) return null;

  const from = page === sel.start.page ? sel.start.index : 0;

  const lastRun = geo.runs[geo.runs.length - 1];
  const lastCharOnPage = lastRun.charStart + lastRun.glyphs.length - 1;

  const to = page === sel.end.page ? sel.end.index : lastCharOnPage;

  return { from, to };
}

/**
 * Helper: build rects for a slice of the page
 * @param geo - page geometry
 * @param from - from index
 * @param to - to index
 * @returns rects
 */
export function rectsWithinSlice(geo: PdfPageGeometry, from: number, to: number): Rect[] {
  const rects: Rect[] = [];

  for (const run of geo.runs) {
    const runStart = run.charStart;
    const runEnd = runStart + run.glyphs.length - 1;
    if (runEnd < from || runStart > to) continue;

    const sIdx = Math.max(from, runStart) - runStart;
    const eIdx = Math.min(to, runEnd) - runStart;

    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    for (let i = sIdx; i <= eIdx; i++) {
      const g = run.glyphs[i];
      if (g.flags === 2) continue; // empty glyph

      minX = Math.min(minX, g.x);
      maxX = Math.max(maxX, g.x + g.width);
      minY = Math.min(minY, g.y);
      maxY = Math.max(maxY, g.y + g.height);
    }

    if (minX !== Infinity) {
      rects.push({
        origin: { x: minX, y: minY },
        size: { width: maxX - minX, height: maxY - minY },
      });
    }
  }
  return rects;
}
