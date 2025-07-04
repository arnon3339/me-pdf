/** @jsxImportSource preact */
import { JSX } from 'preact';
import { Rect } from '@embedpdf/models';
import { SquigglyDefaults } from '@embedpdf/plugin-annotation';

interface SquigglyProps {
  activeTool: SquigglyDefaults;
  rects: Rect[];
  scale: number;
}

export function Squiggly({ activeTool, rects, scale }: SquigglyProps) {
  const amplitude = 2 * scale; // wave height
  const period = 6 * scale; // wave length

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${period}" height="${amplitude * 2}" viewBox="0 0 ${period} ${amplitude * 2}">
      <path d="M0 ${amplitude} Q ${period / 4} 0 ${period / 2} ${amplitude} T ${period} ${amplitude}"
            fill="none" stroke="${activeTool.color}" stroke-width="${amplitude}" stroke-linecap="round"/>
    </svg>`;

  // Completely escape the SVG markup
  const svgDataUri = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

  return (
    <>
      {rects.map((r, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: r.origin.x * scale,
            top: (r.origin.y + r.size.height) * scale - amplitude,
            width: r.size.width * scale,
            height: amplitude * 2,
            backgroundImage: svgDataUri,
            backgroundRepeat: 'repeat-x',
            backgroundSize: `${period}px ${amplitude * 2}px`,
            opacity: activeTool.opacity,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}
