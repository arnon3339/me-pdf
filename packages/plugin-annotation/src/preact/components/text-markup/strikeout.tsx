/** @jsxImportSource preact */
import { JSX } from 'preact';
import { Rect } from '@embedpdf/models';

interface StrikeoutProps {
  color?: string;
  opacity?: number;
  rects: Rect[];
  scale: number;
}

export function Strikeout({ color = '#FFFF00', opacity = 0.5, rects, scale }: StrikeoutProps) {
  const thickness = 2 * scale;

  return (
    <>
      {rects.map((r, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: r.origin.x * scale,
            top: (r.origin.y + r.size.height / 2) * scale - thickness / 2,
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
