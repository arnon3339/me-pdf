import { useMemo, MouseEvent } from '@framework';
import { Rect, LinePoints, LineEndings, PdfAnnotationLineEnding } from '@embedpdf/models';

/* ---------------------------------------------------------------- *\
|* Types                                                            *|
\* ---------------------------------------------------------------- */

interface LineProps {
  /** Stroke colour (falls back to PDFium default black) */
  color?: string;
  /** 0 – 1 */
  opacity?: number;
  /** Stroke width in PDF units */
  strokeWidth: number;
  /** Bounding box of the annotation */
  rect: Rect;
  /** Line start / end points (page units) */
  linePoints: LinePoints;
  /** Line endings (eg. OpenArrow / Butt) */
  lineEndings?: LineEndings;
  /** Current page zoom factor */
  scale: number;
  /** Click handler (used for selection) */
  onClick?: (e: MouseEvent<SVGElement>) => void;
  /** Cursor shown over the annotation */
  cursor?: string;
}

/* ---------------------------------------------------------------- *\
|* Helper funcs                                                     *|
\* ---------------------------------------------------------------- */

/** Arrow geometry relative to its tip (0,0). */
const buildOpenArrow = (len: number, halfAngleRad = Math.PI / 6): string => {
  const a = halfAngleRad;
  const x = -len * Math.cos(a);
  const y = len * Math.sin(a);
  // one path, two segments sharing the same corner
  return `M 0 0 L ${x} ${y} L 0 0 L ${x} ${-y}`;
};

/** Butt = small perpendicular segment centred on the tip. */
const buildButt = (len: number): string => {
  const l = len / 2;
  return `M ${-l} 0 L ${l} 0`;
};

/**
 * Renders a PDF Line annotation as SVG (with arrow/butt endings).
 */
export function Line({
  color = '#000000',
  opacity = 1,
  strokeWidth,
  rect,
  linePoints,
  lineEndings,
  scale,
  onClick,
  cursor,
}: LineProps): JSX.Element {
  /* -------------------------------------------------------------- */
  /*  Localise the line within its own bounding box                 */
  /* -------------------------------------------------------------- */
  const { x1, y1, x2, y2 } = useMemo(() => {
    return {
      x1: linePoints.start.x - rect.origin.x,
      y1: linePoints.start.y - rect.origin.y,
      x2: linePoints.end.x - rect.origin.x,
      y2: linePoints.end.y - rect.origin.y,
    };
  }, [linePoints, rect]);

  /* -------------------------------------------------------------- */
  /*  Arrow-head path data + transforms                             */
  /* -------------------------------------------------------------- */
  const endings = useMemo(() => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const perp = angle + Math.PI / 2;

    const make = (
      ending: PdfAnnotationLineEnding | undefined,
      px: number,
      py: number,
      rad: number,
    ) => {
      switch (ending) {
        case PdfAnnotationLineEnding.OpenArrow:
          return {
            d: buildOpenArrow(strokeWidth * 9),
            transform: `translate(${px} ${py}) rotate(${(rad * 180) / Math.PI})`,
          };
        case PdfAnnotationLineEnding.Butt:
          return {
            d: buildButt(strokeWidth * 6),
            transform: `translate(${px} ${py}) rotate(${(perp * 180) / Math.PI})`,
          };
        default:
          return null;
      }
    };

    return {
      start: make(lineEndings?.start, x1, y1, angle + Math.PI),
      end: make(lineEndings?.end, x2, y2, angle),
    };
  }, [lineEndings, strokeWidth, x1, y1, x2, y2]);

  /* -------------------------------------------------------------- */
  /*  Absolute placement + scaling (same pattern as other shapes)   */
  /* -------------------------------------------------------------- */
  const width = rect.size.width * scale;
  const height = rect.size.height * scale;

  return (
    <svg
      style={{
        position: 'absolute',
        width,
        height,
        pointerEvents: 'none',
        zIndex: 2,
      }}
      width={width}
      height={height}
      viewBox={`0 0 ${rect.size.width} ${rect.size.height}`}
    >
      {/* Main line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        opacity={opacity}
        onMouseDown={onClick}
        style={{
          cursor,
          pointerEvents: 'visibleStroke',
          stroke: color,
          strokeWidth,
          strokeLinecap: 'butt',
        }}
      />

      {/* Optional arrowheads / butt caps */}
      {endings.start && (
        <path
          d={endings.start.d}
          transform={endings.start.transform}
          stroke={color}
          style={{
            strokeWidth,
            strokeLinecap: 'butt',
            pointerEvents: 'visibleStroke',
          }}
          fill="none"
        />
      )}
      {endings.end && (
        <path
          d={endings.end.d}
          transform={endings.end.transform}
          stroke={color}
          style={{
            strokeWidth,
            strokeLinecap: 'butt',
            pointerEvents: 'visibleStroke',
          }}
          fill="none"
        />
      )}
    </svg>
  );
}
