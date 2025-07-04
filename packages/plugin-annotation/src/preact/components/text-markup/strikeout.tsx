/** @jsxImportSource preact */
import { JSX } from 'preact';
import { Rect } from '@embedpdf/models';
import { StrikeoutDefaults } from '@embedpdf/plugin-annotation';

interface StrikeoutProps {
  activeTool: StrikeoutDefaults;
  rects: Rect[];
  scale: number;
}

export function Strikeout({ activeTool, rects, scale }: StrikeoutProps) {
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
            background: activeTool.color,
            opacity: activeTool.opacity,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}
