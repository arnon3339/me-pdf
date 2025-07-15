/** @jsxImportSource preact */
import { JSX } from 'preact';
import { useMemo } from 'preact/hooks';
import { PdfInkListObject, Rect } from '@embedpdf/models';

/* ---------------------------------------------------------------- *\
|* Types                                                            *|
\* ---------------------------------------------------------------- */

interface InkProps {
  /** Stroke colour (falls back to PDFium default black) */
  color?: string;
  /** 0 – 1 */
  opacity?: number;
  /** Line width in PDF units */
  strokeWidth: number;
  /** Array of strokes — exactly as in your JSON */
  inkList: PdfInkListObject[];
  /** Bounding box of the whole annotation */
  rect: Rect;
  /** Page zoom factor */
  scale: number;
  /** Callback for when the annotation is clicked */
  onClick?: (e: MouseEvent) => void;
}

/**
 * Renders a PDF Ink annotation (free-hand drawing) as SVG.
 */
export function Ink({
  color = '#000000',
  opacity = 1,
  strokeWidth,
  inkList,
  rect,
  scale,
  onClick,
}: InkProps) {
  /* convert each stroke to an SVG <path d=""> string */
  const paths = useMemo(() => {
    return inkList.map(({ points }) => {
      let d = '';
      points.forEach(({ x, y }, i) => {
        // localise to the annotation’s own bbox so viewBox can stay tidy
        const lx = x - rect.origin.x;
        const ly = y - rect.origin.y;
        d += (i === 0 ? 'M' : 'L') + lx + ' ' + ly + ' ';
      });
      return d.trim();
    });
  }, [inkList, rect]);

  /* absolute placement + scaling just like your text-markup components */
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
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={opacity}
          pointerEvents="visibleStroke"
          onMouseDown={onClick}
          style={{
            cursor: 'pointer',
          }}
        />
      ))}
    </svg>
  );
}
