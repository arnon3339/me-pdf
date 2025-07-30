import { Fragment, h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { PdfAnnotationBorderStyle, PdfAnnotationLineEnding } from '@embedpdf/models';

/* Slider ─────────────────────────────────────────────────────────── */
export const Slider = ({
  value,
  min = 0,
  max = 1,
  step = 0.1,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) => (
  <input
    type="range"
    class="range-sm mb-2 h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
    value={value}
    min={min}
    max={max}
    step={step}
    onInput={(e) => onChange(parseFloat((e.target as HTMLInputElement).value))}
  />
);

/* Color swatch ───────────────────────────────────────────────────── */
export const ColorSwatch = ({
  color,
  active,
  onSelect,
}: {
  color: string;
  active: boolean;
  onSelect: (c: string) => void;
}) => {
  /* Helper: detect “fully transparent” colours */
  const isTransparent = (c: string) =>
    c === 'transparent' ||
    /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)$/i.test(c) || // rgba(...,0)
    (/^#([0-9a-f]{8})$/i.test(c) && c.slice(-2).toLowerCase() === '00') || // #RRGGBBAA, alpha 00
    (/^#([0-9a-f]{4})$/i.test(c) && c.slice(-1).toLowerCase() === '0'); // #RGBA,  A=0

  const baseStyle: h.JSX.CSSProperties = isTransparent(color)
    ? {
        backgroundColor: '#fff',
        backgroundImage:
          'linear-gradient(45deg, transparent 40%, red 40%, red 60%, transparent 60%)',
        backgroundSize: '100% 100%',
      }
    : { backgroundColor: color };

  return (
    <button
      title={color}
      class={`h-5 w-5 rounded-full border border-gray-400 ${
        active ? 'outline outline-2 outline-offset-2 outline-blue-500' : ''
      }`}
      style={baseStyle}
      onClick={() => onSelect(color)}
    />
  );
};

// —— Stroke-style picker ────────────────────────────────────────────
type StrokeItem = { id: PdfAnnotationBorderStyle; dash?: number[] };

const STROKES: StrokeItem[] = [
  { id: PdfAnnotationBorderStyle.SOLID }, // solid
  { id: PdfAnnotationBorderStyle.DASHED, dash: [6, 2] }, // long dash
  { id: PdfAnnotationBorderStyle.DASHED, dash: [8, 4] }, // long dash
  { id: PdfAnnotationBorderStyle.DASHED, dash: [3, 3] }, // dash
  { id: PdfAnnotationBorderStyle.DASHED, dash: [1, 2] }, // dot
  { id: PdfAnnotationBorderStyle.DASHED, dash: [4, 2, 1, 2] }, // dash-dot
  { id: PdfAnnotationBorderStyle.DASHED, dash: [8, 4, 1, 4] }, // dash-dot-dot
];

export const StrokeStyleSelect = ({
  value,
  onChange,
}: {
  value: StrokeItem;
  onChange: (s: StrokeItem) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  const renderSvg = (dash?: number[]) => (
    <svg width="80" height="8" viewBox="0 0 80 8">
      <line
        x1="0"
        y1="4"
        x2="80"
        y2="4"
        style={{
          strokeDasharray: dash?.join(' '),
          stroke: 'black',
          strokeWidth: '2',
        }}
      />
    </svg>
  );

  return (
    <div ref={ref} class="relative inline-block w-full">
      {/* trigger */}
      <button
        class="flex w-full items-center justify-between gap-2 rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
        onClick={() => setOpen((o) => !o)}
      >
        {renderSvg(value.dash)}
        {/* chevron */}
        <svg
          class="h-4 w-4 text-gray-600 dark:text-gray-300"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* dropdown */}
      {open && (
        <div class="absolute z-10 mt-1 w-full rounded border bg-white p-1 shadow">
          {STROKES.map((s, idx) => (
            <button
              key={idx}
              class="block w-full rounded px-1 py-2 hover:bg-gray-100"
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
            >
              {renderSvg(s.dash)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────
 * Line-ending picker
 * ───────────────────────────────────────────────────────────────── */

const ENDINGS: PdfAnnotationLineEnding[] = [
  PdfAnnotationLineEnding.None,
  PdfAnnotationLineEnding.Square,
  PdfAnnotationLineEnding.Circle,
  PdfAnnotationLineEnding.Diamond,
  PdfAnnotationLineEnding.OpenArrow,
  PdfAnnotationLineEnding.ClosedArrow,
  PdfAnnotationLineEnding.ROpenArrow,
  PdfAnnotationLineEnding.RClosedArrow,
  PdfAnnotationLineEnding.Butt,
  PdfAnnotationLineEnding.Slash,
];
/**
 * Renders an SVG icon representing a line with a specific ending style.
 */
const LineEndingIcon = ({
  ending,
  position,
}: {
  ending: PdfAnnotationLineEnding;
  position: 'start' | 'end';
}) => {
  // Define markers as SVG elements, positioned for the 'end' of the line.
  const MARKERS: Partial<Record<PdfAnnotationLineEnding, h.JSX.Element>> = {
    [PdfAnnotationLineEnding.Square]: <path d="M68 -4 L76 -4 L76 4 L68 4 Z" />,
    [PdfAnnotationLineEnding.Circle]: <circle cx="72" cy="0" r="4" />,
    [PdfAnnotationLineEnding.Diamond]: <path d="M72 -5 L77 0 L72 5 L67 0 Z" />,
    [PdfAnnotationLineEnding.OpenArrow]: <path d="M67 -5 L77 0 L67 5" fill="none" />,
    [PdfAnnotationLineEnding.ClosedArrow]: <path d="M67 -5 L77 0 L67 5 Z" />,
    [PdfAnnotationLineEnding.ROpenArrow]: <path d="M77 -5 L67 0 L77 5" fill="none" />,
    [PdfAnnotationLineEnding.RClosedArrow]: <path d="M77 -5 L67 0 L77 5 Z" />,
    [PdfAnnotationLineEnding.Butt]: <path d="M72 -5 L72 5" fill="none" />,
    [PdfAnnotationLineEnding.Slash]: <path d="M67 -5 L77 5" fill="none" />,
  };

  // NEW: Adjust the line's endpoint (x2) for perfect visual connection.
  const LINE_ENDPOINT_ADJUSTMENTS: Partial<Record<PdfAnnotationLineEnding, number>> = {
    [PdfAnnotationLineEnding.Square]: 68, // Stop line at the start of the square
    [PdfAnnotationLineEnding.Circle]: 68, // Stop line before the circle (center - radius)
    [PdfAnnotationLineEnding.Diamond]: 67, // Stop line at the diamond's vertex
    [PdfAnnotationLineEnding.OpenArrow]: 76, // Stop line where the arrow begins
    [PdfAnnotationLineEnding.ClosedArrow]: 67,
    [PdfAnnotationLineEnding.ROpenArrow]: 67, // Pull line back to meet reversed arrow
    [PdfAnnotationLineEnding.RClosedArrow]: 67,
    [PdfAnnotationLineEnding.Butt]: 72,
    [PdfAnnotationLineEnding.Slash]: 72,
  };

  const marker = MARKERS[ending];
  const defaultLineEndX = 77; // Default longer line for 'None'
  const lineEndX = LINE_ENDPOINT_ADJUSTMENTS[ending] ?? defaultLineEndX;

  // For 'start' position, just rotate the whole drawing 180 degrees.
  const groupTransform = position === 'start' ? 'rotate(180 40 10)' : '';

  return (
    <svg width="80" height="20" viewBox="0 0 80 20" class="text-black dark:text-white">
      <g transform={groupTransform}>
        {/* The main line - its x2 attribute is now dynamic */}
        <line x1="4" y1="10" x2={lineEndX} y2="10" stroke="currentColor" stroke-width="1.5" />
        {/* The marker, translated to the correct y-position and styled */}
        {marker && (
          <g
            transform="translate(0, 10)"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="1.5"
          >
            {marker}
          </g>
        )}
      </g>
    </svg>
  );
};

export const LineEndingSelect = ({
  value,
  onChange,
  position,
}: {
  value: PdfAnnotationLineEnding;
  onChange: (e: PdfAnnotationLineEnding) => void;
  position: 'start' | 'end'; // Determines which side the marker is on
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  return (
    <div ref={ref} class="relative inline-block w-full">
      {/* trigger */}
      <button
        class="flex w-full items-center justify-between gap-2 rounded border border-gray-300 bg-white px-3 py-1 dark:border-gray-600 dark:bg-gray-800"
        onClick={() => setOpen((o) => !o)}
      >
        <LineEndingIcon ending={value} position={position} />
        {/* chevron */}
        <svg
          class="h-4 w-4 text-gray-600 dark:text-gray-300"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* dropdown */}
      {open && (
        <div class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded border bg-white p-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {ENDINGS.map((ending) => (
            <button
              key={ending}
              class="block w-full rounded px-1 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                onChange(ending);
                setOpen(false);
              }}
            >
              <LineEndingIcon ending={ending} position={position} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
