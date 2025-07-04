/** @jsxImportSource preact */
import { JSX } from 'preact';
import { Rect } from '@embedpdf/models';
import { UnderlineDefaults } from '@embedpdf/plugin-annotation';

interface UnderlineProps {
  activeTool: UnderlineDefaults;
  rects: Rect[];
  scale: number;
}

export function Underline({ activeTool, rects, scale }: UnderlineProps) {
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
            background: activeTool.color,
            opacity: activeTool.opacity,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}
