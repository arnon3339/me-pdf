import { useMemo, MouseEvent } from '@framework';
import { Rect, LinePoints, LineEndings, PdfAnnotationLineEnding } from '@embedpdf/models';

/* ---------------------------------------------------------------- *\
|* Types                                                            *|
\* ---------------------------------------------------------------- */

interface LineProps {
  /** interior colour */
  color?: string;
  /** 0 – 1 */
  opacity?: number;
  /** Stroke width in PDF units */
  strokeWidth: number;
  /** Stroke colour (falls back to PDFium default black) */
  strokeColor?: string;
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

/** Open-arrow geometry (outline) relative to its tip (0,0). */
const buildOpenArrow = (len: number, halfAngleRad = Math.PI / 6): string => {
  const a = halfAngleRad;
  const x = -len * Math.cos(a);
  const y = len * Math.sin(a);
  // two arms meeting at the tip
  return `M 0 0 L ${x} ${y} M 0 0 L ${x} ${-y}`;
};

/** Closed-arrow (filled triangle) relative to its tip (0,0). */
const buildClosedArrow = (len: number, halfAngleRad = Math.PI / 6): string => {
  const a = halfAngleRad;
  const x = -len * Math.cos(a);
  const y = len * Math.sin(a);
  return `M 0 0 L ${x} ${y} L ${x} ${-y} Z`;
};

/** Butt = small perpendicular segment centred on the tip. */
const buildButt = (len: number): string => {
  const l = len / 2;
  return `M ${-l} 0 L ${l} 0`;
};

/** Circle outline centred on the tip – len is *diameter*. */
const buildCircle = (diameter: number): string => {
  const r = diameter / 2;
  // Path: move right to (r,0), full circle back to start
  // SVG arc flags: large-arc-flag=1, sweep-flag=1 for first half, then again
  return `M ${r} 0 A ${r} ${r} 0 1 1 ${-r} 0 A ${r} ${r} 0 1 1 ${r} 0`;
};

/**
 * Renders a PDF Line annotation as SVG (with arrow/butt endings).
 */
export function Line({
  color = 'transparent',
  opacity = 1,
  strokeWidth,
  strokeColor = '#000000',
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
        case PdfAnnotationLineEnding.ClosedArrow:
          return {
            d: buildClosedArrow(strokeWidth * 9),
            transform: `translate(${px} ${py}) rotate(${(rad * 180) / Math.PI})`,
            /** Closed arrow should be filled */
            filled: true as const,
          } as const;
        case PdfAnnotationLineEnding.OpenArrow:
          return {
            d: buildOpenArrow(strokeWidth * 9),
            transform: `translate(${px} ${py}) rotate(${(rad * 180) / Math.PI})`,
            filled: false as const,
          };
        case PdfAnnotationLineEnding.Circle:
          return {
            d: buildCircle(strokeWidth * 5),
            transform: `translate(${px} ${py}) rotate(${(rad * 180) / Math.PI})`,
            filled: true as const,
          };
        case PdfAnnotationLineEnding.Butt:
          return {
            d: buildButt(strokeWidth * 6),
            transform: `translate(${px} ${py}) rotate(${(perp * 180) / Math.PI})`,
            filled: false as const,
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
          stroke: strokeColor,
          strokeWidth,
          strokeLinecap: 'butt',
        }}
      />

      {/* Optional arrowheads / butt caps */}
      {endings.start && (
        <path
          d={endings.start.d}
          transform={endings.start.transform}
          onMouseDown={onClick}
          stroke={strokeColor}
          style={{
            cursor,
            strokeWidth,
            strokeLinecap: 'butt',
            pointerEvents: endings.start.filled ? 'visible' : 'visibleStroke',
          }}
          fill={endings.start.filled ? color : 'none'}
        />
      )}
      {endings.end && (
        <path
          d={endings.end.d}
          transform={endings.end.transform}
          stroke={strokeColor}
          onMouseDown={onClick}
          style={{
            cursor,
            strokeWidth,
            strokeLinecap: 'butt',
            pointerEvents: endings.end.filled ? 'visible' : 'visibleStroke',
          }}
          fill={endings.end.filled ? color : 'none'}
        />
      )}
    </svg>
  );
}
