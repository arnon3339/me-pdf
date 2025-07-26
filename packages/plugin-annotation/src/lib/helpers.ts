import { PdfAnnotationSubtype, PdfAnnotationObject } from '@embedpdf/models';
import { TrackedAnnotation } from '@embedpdf/plugin-annotation';

/* ------------------------------------------------------------------ */
/* 1. Generic “subtype‑to‑object” mapper                              */
/* ------------------------------------------------------------------ */

export type AnnoOf<S extends PdfAnnotationSubtype> = Extract<PdfAnnotationObject, { type: S }>;

/* ------------------------------------------------------------------ */
/* 2. Narrowing type‑guards (add more as needed)                      */
/* ------------------------------------------------------------------ */

/** True when `a.object.type === INK` – and narrows the generic. */
export function isInk(
  a: TrackedAnnotation,
): a is TrackedAnnotation<AnnoOf<PdfAnnotationSubtype.INK>> {
  return a.object.type === PdfAnnotationSubtype.INK;
}

/** Example for Circle – create similar ones for Square, Line, etc. */
export function isCircle(
  a: TrackedAnnotation,
): a is TrackedAnnotation<AnnoOf<PdfAnnotationSubtype.CIRCLE>> {
  return a.object.type === PdfAnnotationSubtype.CIRCLE;
}

export function isPolygon(
  a: TrackedAnnotation,
): a is TrackedAnnotation<AnnoOf<PdfAnnotationSubtype.POLYGON>> {
  return a.object.type === PdfAnnotationSubtype.POLYGON;
}

export function isSquare(
  a: TrackedAnnotation,
): a is TrackedAnnotation<AnnoOf<PdfAnnotationSubtype.SQUARE>> {
  return a.object.type === PdfAnnotationSubtype.SQUARE;
}

export function isLine(
  a: TrackedAnnotation,
): a is TrackedAnnotation<AnnoOf<PdfAnnotationSubtype.LINE>> {
  return a.object.type === PdfAnnotationSubtype.LINE;
}

export function isTextMarkup(
  a: TrackedAnnotation,
): a is TrackedAnnotation<
  AnnoOf<
    | PdfAnnotationSubtype.HIGHLIGHT
    | PdfAnnotationSubtype.UNDERLINE
    | PdfAnnotationSubtype.STRIKEOUT
    | PdfAnnotationSubtype.SQUIGGLY
  >
> {
  return (
    a.object.type === PdfAnnotationSubtype.HIGHLIGHT ||
    a.object.type === PdfAnnotationSubtype.UNDERLINE ||
    a.object.type === PdfAnnotationSubtype.STRIKEOUT ||
    a.object.type === PdfAnnotationSubtype.SQUIGGLY
  );
}

export function isHighlight(
  a: TrackedAnnotation,
): a is TrackedAnnotation<AnnoOf<PdfAnnotationSubtype.HIGHLIGHT>> {
  return a.object.type === PdfAnnotationSubtype.HIGHLIGHT;
}

export function isUnderline(
  a: TrackedAnnotation,
): a is TrackedAnnotation<AnnoOf<PdfAnnotationSubtype.UNDERLINE>> {
  return a.object.type === PdfAnnotationSubtype.UNDERLINE;
}

export function isStrikeout(
  a: TrackedAnnotation,
): a is TrackedAnnotation<AnnoOf<PdfAnnotationSubtype.STRIKEOUT>> {
  return a.object.type === PdfAnnotationSubtype.STRIKEOUT;
}

export function isSquiggly(
  a: TrackedAnnotation,
): a is TrackedAnnotation<AnnoOf<PdfAnnotationSubtype.SQUIGGLY>> {
  return a.object.type === PdfAnnotationSubtype.SQUIGGLY;
}
