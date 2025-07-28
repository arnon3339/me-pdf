import { Rect, Position, LineEndings, PdfAnnotationLineEnding } from '@embedpdf/models';

/** Minimum-sized rect that encloses the given points */
export function rectFromPoints(pts: readonly Position[]): Rect {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return {
    origin: { x: Math.min(...xs), y: Math.min(...ys) },
    size: {
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    },
  };
}

/** Grow a rect by *pad* on all four sides */
export function expandRect(r: Rect, pad: number): Rect {
  return {
    origin: { x: r.origin.x - pad, y: r.origin.y - pad },
    size: { width: r.size.width + pad * 2, height: r.size.height + pad * 2 },
  };
}

/** Extra space needed for arrow / butt / etc. endings (approx.) */
export function endingPadding(endings: LineEndings | undefined, strokeWidth: number): number {
  if (!endings) return strokeWidth / 2;

  const arrowLike = new Set([
    PdfAnnotationLineEnding.OpenArrow,
    PdfAnnotationLineEnding.ClosedArrow,
    PdfAnnotationLineEnding.ROpenArrow,
    PdfAnnotationLineEnding.RClosedArrow,
  ]);

  if (arrowLike.has(endings.start) || arrowLike.has(endings.end)) {
    return strokeWidth * 9; // arrow length used in <line-endings>
  }

  if (
    endings.start !== PdfAnnotationLineEnding.None ||
    endings.end !== PdfAnnotationLineEnding.None
  ) {
    return strokeWidth * 5; // circle, square, diamond, butt, slash …
  }

  return strokeWidth / 2;
}
