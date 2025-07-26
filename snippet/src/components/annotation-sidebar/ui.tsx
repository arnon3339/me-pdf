import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { PdfAnnotationBorderStyle } from '@embedpdf/models';

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
