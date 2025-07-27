import { useMemo, MouseEvent } from '@framework';
import { Rect, LinePoints, LineEndings } from '@embedpdf/models';
import { createEnding } from './line-endings';

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
  /*  Arrow-head path data via shared factory                       */
  /* -------------------------------------------------------------- */
  const endings = useMemo(() => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    return {
      start: createEnding(lineEndings?.start, strokeWidth, angle + Math.PI, x1, y1),
      end: createEnding(lineEndings?.end, strokeWidth, angle, x2, y2),
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
