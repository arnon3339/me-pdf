import { useMemo, MouseEvent } from '@framework';
import { PdfAnnotationBorderStyle, Rect } from '@embedpdf/models';

/* ---------------------------------------------------------------- *\
|* Types                                                            *|
\* ---------------------------------------------------------------- */

interface SquareProps {
  /** Fill colour – defaults to PDFium’s black if omitted */
  color?: string;
  /** Stroke colour – defaults to same as fill when omitted */
  strokeColor?: string;
  /** 0 – 1 */
  opacity?: number;
  /** Stroke width in PDF units */
  strokeWidth: number;
  /** Stroke type – defaults to solid when omitted */
  strokeStyle?: PdfAnnotationBorderStyle;
  /** Stroke dash array – defaults to undefined when omitted */
  strokeDashArray?: number[];
  /** Bounding box of the annotation (PDF units) */
  rect: Rect;
  /** Current page zoom factor */
  scale: number;
  /** Click handler (used for selection) */
  onClick?: (e: MouseEvent<SVGElement>) => void;
  /** Cursor shown over the annotation */
  cursor?: string;
}

/**
 * Renders a PDF Square annotation (rectangle) as SVG.
 */
export function Square({
  color = '#000000',
  strokeColor,
  opacity = 1,
  strokeWidth,
  strokeStyle = PdfAnnotationBorderStyle.SOLID,
  strokeDashArray,
  rect,
  scale,
  onClick,
  cursor,
}: SquareProps): JSX.Element {
  /* ------------------------------------------------------------------ */
  /* geometry helpers                                                   */
  /* ------------------------------------------------------------------ */
  const { width, height, x, y } = useMemo(() => {
    // Full bounding box *includes* stroke width.
    const outerW = rect.size.width;
    const outerH = rect.size.height;

    // Remove the stroke so the visible fill matches the preview.
    const innerW = Math.max(outerW - strokeWidth, 0);
    const innerH = Math.max(outerH - strokeWidth, 0);

    return {
      width: innerW,
      height: innerH,
      x: strokeWidth / 2,
      y: strokeWidth / 2,
    };
  }, [rect, strokeWidth]);

  const svgWidth = (width + strokeWidth) * scale;
  const svgHeight = (height + strokeWidth) * scale;

  return (
    <svg
      style={{
        position: 'absolute',
        width: svgWidth,
        height: svgHeight,
        pointerEvents: 'none',
        zIndex: 2,
      }}
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${width + strokeWidth} ${height + strokeWidth}`}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        opacity={opacity}
        onMouseDown={onClick}
        style={{
          cursor,
          pointerEvents: color === 'transparent' ? 'visibleStroke' : 'visible',
          stroke: strokeColor ?? color,
          strokeWidth,
          ...(strokeStyle === PdfAnnotationBorderStyle.DASHED && {
            strokeDasharray: strokeDashArray?.join(','),
          }),
        }}
      />
    </svg>
  );
}
