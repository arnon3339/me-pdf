/** @jsxImportSource preact */
import { JSX } from 'preact';
import { Rect } from '@embedpdf/models';

interface HighlightProps {
  color?: string;
  opacity?: number;
  rects: Rect[];
  scale: number;
}

export function Highlight({ color = '#FFFF00', opacity = 0.5, rects, scale }: HighlightProps) {
  return (
    <>
      {rects.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.origin.x * scale,
            top: b.origin.y * scale,
            width: b.size.width * scale,
            height: b.size.height * scale,
            background: color,
            opacity: opacity,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}
