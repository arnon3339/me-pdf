import { MouseEvent, useMemo } from '@framework';
import { Rect, Position } from '@embedpdf/models';

interface PolygonProps {
  rect: Rect;
  vertices: Position[];
  color?: string; // interior fill colour
  strokeColor?: string;
  opacity?: number;
  strokeWidth: number;
  scale: number;
  isSelected: boolean;
  onClick?: (e: MouseEvent<SVGElement>) => void;
}

export function Polygon({
  rect,
  vertices,
  color = 'transparent',
  strokeColor = '#000000',
  opacity = 1,
  strokeWidth,
  scale,
  isSelected,
  onClick,
}: PolygonProps): JSX.Element {
  // Translate vertices into local coords
  const localPts = useMemo(
    () => vertices.map(({ x, y }) => ({ x: x - rect.origin.x, y: y - rect.origin.y })),
    [vertices, rect],
  );

  const pathData = useMemo(() => {
    if (!localPts.length) return '';
    const [first, ...rest] = localPts;
    return (`M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y} `).join('') + 'Z').trim();
  }, [localPts]);

  const width = rect.size.width * scale;
  const height = rect.size.height * scale;

  return (
    <svg
      style={{ position: 'absolute', width, height, pointerEvents: 'none', zIndex: 2 }}
      width={width}
      height={height}
      viewBox={`0 0 ${rect.size.width} ${rect.size.height}`}
    >
      <path
        d={pathData}
        onMouseDown={onClick}
        opacity={opacity}
        style={{
          fill: color,
          stroke: strokeColor ?? color,
          strokeWidth,
          cursor: isSelected ? 'move' : 'pointer',
          pointerEvents: color === 'transparent' ? 'visibleStroke' : 'visible',
          strokeLinecap: 'butt',
          strokeLinejoin: 'miter',
        }}
      />
    </svg>
  );
}
