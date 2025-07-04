/** @jsxImportSource preact */
import { JSX } from 'preact';
import { Rect } from '@embedpdf/models';
import { HighlightDefaults } from '@embedpdf/plugin-annotation';

interface HighlightProps {
  activeTool: HighlightDefaults;
  rects: Rect[];
  scale: number;
}

export function Highlight({ activeTool, rects, scale }: HighlightProps) {
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
            background: activeTool.color,
            opacity: activeTool.opacity,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}
