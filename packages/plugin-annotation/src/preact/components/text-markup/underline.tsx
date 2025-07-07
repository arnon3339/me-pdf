/** @jsxImportSource preact */
import { JSX } from 'preact';
import { Rect } from '@embedpdf/models';

interface UnderlineProps {
  color?: string;
  opacity?: number;
  rects: Rect[];
  scale: number;
}

export function Underline({ color = '#FFFF00', opacity = 0.5, rects, scale }: UnderlineProps) {
  const thickness = 2 * scale; // 2 CSS px at 100 % zoom

  return (
    <>
      {rects.map((r, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: r.origin.x * scale,
            top: (r.origin.y + r.size.height) * scale - thickness,
            width: r.size.width * scale,
            height: thickness,
            background: color,
            opacity: opacity,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}
