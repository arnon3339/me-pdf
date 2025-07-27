import { PdfAnnotationLineEnding } from '@embedpdf/models';

export interface SvgEnding {
  d: string;
  transform: string;
  filled: boolean;
}

/** Internal geometry helpers – all centred on the tip (0,0) */
const buildOpenArrow = (len: number, halfAngleRad = Math.PI / 6) => {
  const a = halfAngleRad;
  const x = -len * Math.cos(a);
  const y = len * Math.sin(a);
  return `M ${x} ${y} L 0 0 L ${x} ${-y}`;
};

const buildClosedArrow = (len: number, halfAngleRad = Math.PI / 6) => {
  const a = halfAngleRad;
  const x = -len * Math.cos(a);
  const y = len * Math.sin(a);
  return `M 0 0 L ${x} ${y} L ${x} ${-y} Z`;
};

const buildCircle = (diameter: number) => {
  const r = diameter / 2;
  return `M ${r} 0 A ${r} ${r} 0 1 1 ${-r} 0 A ${r} ${r} 0 1 1 ${r} 0`;
};

const buildSquare = (len: number) => {
  const h = len / 2;
  return `M ${-h} ${-h} L ${h} ${-h} L ${h} ${h} L ${-h} ${h} Z`;
};

const buildDiamond = (len: number) => {
  const h = len / 2;
  return `M 0 ${-h} L ${h} 0 L 0 ${h} L ${-h} 0 Z`;
};

const buildButt = (len: number) => {
  const l = len / 2;
  return `M ${-l} 0 L ${l} 0`;
};

const buildSlash = (len: number) => {
  const l = len / 2;
  return `M ${-l} 0 L ${l} 0`;
};

/** Factory: returns SVG path + transform for a given PDF ending type. */
export function createEnding(
  ending: PdfAnnotationLineEnding | undefined,
  strokeWidth: number,
  rad: number, // direction angle in radians (tip pointing direction)
  px: number,
  py: number,
): SvgEnding | null {
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const perp = rad + Math.PI / 2;

  switch (ending) {
    case PdfAnnotationLineEnding.OpenArrow:
      return {
        d: buildOpenArrow(strokeWidth * 9),
        transform: `translate(${px} ${py}) rotate(${toDeg(rad)})`,
        filled: false,
      };
    case PdfAnnotationLineEnding.ClosedArrow:
      return {
        d: buildClosedArrow(strokeWidth * 9),
        transform: `translate(${px} ${py}) rotate(${toDeg(rad)})`,
        filled: true,
      };
    case PdfAnnotationLineEnding.ROpenArrow:
      return {
        d: buildOpenArrow(strokeWidth * 9),
        transform: `translate(${px} ${py}) rotate(${toDeg(rad + Math.PI)})`,
        filled: false,
      };
    case PdfAnnotationLineEnding.RClosedArrow:
      return {
        d: buildClosedArrow(strokeWidth * 9),
        transform: `translate(${px} ${py}) rotate(${toDeg(rad + Math.PI)})`,
        filled: true,
      };
    case PdfAnnotationLineEnding.Circle:
      return {
        d: buildCircle(strokeWidth * 5),
        transform: `translate(${px} ${py})`,
        filled: true,
      };
    case PdfAnnotationLineEnding.Square:
      return {
        d: buildSquare(strokeWidth * 6),
        transform: `translate(${px} ${py})`,
        filled: true,
      };
    case PdfAnnotationLineEnding.Diamond:
      return {
        d: buildDiamond(strokeWidth * 6),
        transform: `translate(${px} ${py})`,
        filled: true,
      };
    case PdfAnnotationLineEnding.Butt:
      return {
        d: buildButt(strokeWidth * 6),
        transform: `translate(${px} ${py}) rotate(${toDeg(perp)})`,
        filled: false,
      };
    case PdfAnnotationLineEnding.Slash:
      return {
        d: buildSlash(strokeWidth * 18),
        transform: `translate(${px} ${py}) rotate(${toDeg(rad + Math.PI / 1.5)})`,
        filled: false,
      };
    default:
      return null;
  }
}
