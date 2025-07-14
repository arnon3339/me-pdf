/* ---------------------------------------------------------------- *\
|* LeftPanelAnnotationStyle – cleaned‑up, extensible sidebar         *|
|*                                                                    *|
|* • Uses Tailwind for styling                                        *|
|* • Dynamically renders controls based on the active annotation      *|
|*   subtype.                                                         *|
|* • Currently supports:                                              *|
|*     – Highlight / Underline / Strikeout / Squiggly → color + opacity|
|*     – Ink                                          → color + opacity + strokeWidth|
|* • Easy to extend: add a new entry to CONTROL_MAP with the desired  *|
|*   controls array.                                                  *|
\* ---------------------------------------------------------------- */

/** @jsxImportSource preact */
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  PdfAnnotationSubtype,
  WebAlphaColor,
  PdfAnnotationObject,
  PdfInkAnnoObject,
} from '@embedpdf/models';
import type { InkDefaults, SelectedAnnotation, StylableSubtype } from '@embedpdf/plugin-annotation';
import { useAnnotationCapability } from '@embedpdf/plugin-annotation/preact';
import { useDebounce } from '../hooks/use-debounce';
import { Icon } from './ui/icon';

/* ---------------------------------------------------------------- *\
|* Types                                                             *|
\* ---------------------------------------------------------------- */
interface LeftPanelAnnotationStyleProps {
  selectedAnnotation: SelectedAnnotation | null;
  annotationMode: PdfAnnotationSubtype | null;
  colorPresets: string[];
}

/** A single control description – used to generate the UI. */
interface ControlConfig {
  id: 'color' | 'opacity' | 'strokeWidth';
  label: string;
  min?: number;
  max?: number;
  step?: number;
}

/* ---------------------------------------------------------------- *\
|* Control map – extend for new sub‑types                            *|
\* ---------------------------------------------------------------- */
const CONTROL_MAP: Partial<Record<PdfAnnotationSubtype, ControlConfig[]>> = {
  [PdfAnnotationSubtype.HIGHLIGHT]: [
    { id: 'color', label: 'Color' },
    { id: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.05 },
  ],
  [PdfAnnotationSubtype.UNDERLINE]: [
    { id: 'color', label: 'Color' },
    { id: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.05 },
  ],
  [PdfAnnotationSubtype.STRIKEOUT]: [
    { id: 'color', label: 'Color' },
    { id: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.05 },
  ],
  [PdfAnnotationSubtype.SQUIGGLY]: [
    { id: 'color', label: 'Color' },
    { id: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.05 },
  ],
  [PdfAnnotationSubtype.INK]: [
    { id: 'color', label: 'Color' },
    { id: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.05 },
    { id: 'strokeWidth', label: 'Stroke width', min: 1, max: 30, step: 1 },
  ],
};

/* ---------------------------------------------------------------- *\
|* Helper components                                                  *|
\* ---------------------------------------------------------------- */
const Slider = ({
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
  onChange: (val: number) => void;
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

const ColorSwatch = ({
  color,
  active,
  onSelect,
}: {
  color: string;
  active: boolean;
  onSelect: (c: string) => void;
}) => (
  <button
    title={color}
    class={`h-5 w-5 rounded-full border border-gray-400 ${
      active ? 'outline outline-2 outline-offset-2 outline-blue-500' : ''
    }`}
    style={{ backgroundColor: color }}
    onClick={() => onSelect(color)}
  />
);

/* ---------------------------------------------------------------- *\
|* Utility helpers                                                   *|
\* ---------------------------------------------------------------- */
const getAlphaFromAnnotation = (anno: PdfAnnotationObject): WebAlphaColor => {
  switch (anno.type) {
    case PdfAnnotationSubtype.HIGHLIGHT:
    case PdfAnnotationSubtype.UNDERLINE:
    case PdfAnnotationSubtype.STRIKEOUT:
    case PdfAnnotationSubtype.SQUIGGLY:
    case PdfAnnotationSubtype.INK:
      return { color: anno.color, opacity: anno.opacity };
    default:
      return { color: '#FFFF00', opacity: 1 };
  }
};

/* ---------------------------------------------------------------- *\
|* Main component                                                    *|
\* ---------------------------------------------------------------- */
export const leftPanelAnnotationStyleRenderer = ({
  selectedAnnotation,
  annotationMode,
  colorPresets,
}: LeftPanelAnnotationStyleProps) => {
  const { provides: annotation } = useAnnotationCapability();

  // Resolve active subtype (selected annotation > current tool)
  const activeSubtype: PdfAnnotationSubtype | null =
    selectedAnnotation?.annotation.type ?? annotationMode ?? null;

  if (!activeSubtype || !annotation) {
    return (
      <div class="flex flex-col items-center gap-2 p-4 text-gray-500">
        <Icon icon="palette" className="h-18 w-18 text-gray-500" />
        <div className="max-w-[150px] text-center text-sm text-gray-500">
          Select an annotation to see styles
        </div>
      </div>
    );
  }

  const controls = CONTROL_MAP[activeSubtype] ?? [];

  /* ---------- current base values ---------- */
  const defaultsForSubtype = annotation.getToolDefaults(activeSubtype as StylableSubtype);
  const baseAlpha: WebAlphaColor = selectedAnnotation
    ? getAlphaFromAnnotation(selectedAnnotation.annotation)
    : { color: defaultsForSubtype.color, opacity: defaultsForSubtype.opacity };

  /* ----------------- Color ----------------- */
  const [color, setColor] = useState<string>(baseAlpha.color);
  useEffect(() => setColor(baseAlpha.color), [baseAlpha.color]);

  const changeColor = (c: string) => {
    setColor(c);
    applyPatch({ color: c });
  };

  /* ---------------- Opacity ---------------- */
  const [opacityLocal, setOpacityLocal] = useState<number>(baseAlpha.opacity);
  useEffect(() => setOpacityLocal(baseAlpha.opacity), [baseAlpha.opacity]);
  const debouncedOpacity = useDebounce(opacityLocal, 300);
  useEffect(() => applyPatch({ opacity: debouncedOpacity }), [debouncedOpacity]);

  /* ------------- Stroke width -------------- */
  const initialStrokeWidth = (() => {
    if (activeSubtype !== PdfAnnotationSubtype.INK) return 1;
    return selectedAnnotation?.annotation.type === PdfAnnotationSubtype.INK
      ? (selectedAnnotation.annotation as PdfInkAnnoObject).strokeWidth
      : (defaultsForSubtype as InkDefaults).strokeWidth;
  })();

  const [strokeWidthLocal, setStrokeWidthLocal] = useState<number>(initialStrokeWidth);
  const debouncedStroke = useDebounce(strokeWidthLocal, 300);
  useEffect(() => {
    if (activeSubtype === PdfAnnotationSubtype.INK) {
      applyPatch({ strokeWidth: debouncedStroke });
    }
  }, [debouncedStroke]);

  /* ---------------- Patch util ------------- */
  function applyPatch(patch: Partial<any>) {
    if (selectedAnnotation) {
      annotation?.updateAnnotation(selectedAnnotation.pageIndex, selectedAnnotation.localId, patch);
    } else {
      annotation?.setToolDefaults(activeSubtype as StylableSubtype, patch);
    }
  }

  /* ---------------- Render ----------------- */
  return (
    <div class="p-4">
      <h2 class="text-md mb-4 font-medium">
        {selectedAnnotation ? 'Annotation styles' : 'Tool defaults'}
      </h2>

      {controls.map((ctrl) => {
        switch (ctrl.id) {
          case 'color':
            return (
              <section key="color" class="mb-6">
                <label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  {ctrl.label}
                </label>
                <div class="flex justify-between gap-1">
                  {colorPresets.map((c) => (
                    <ColorSwatch key={c} color={c} active={c === color} onSelect={changeColor} />
                  ))}
                </div>
              </section>
            );
          case 'opacity':
            return (
              <section key="opacity" class="mb-6">
                <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
                  {ctrl.label}
                </label>
                <Slider
                  value={opacityLocal}
                  min={ctrl.min}
                  max={ctrl.max}
                  step={ctrl.step}
                  onChange={setOpacityLocal}
                />
                <span class="text-xs text-gray-500">{Math.round(opacityLocal * 100)}%</span>
              </section>
            );
          case 'strokeWidth':
            if (activeSubtype !== PdfAnnotationSubtype.INK) return null;
            return (
              <section key="strokeWidth" class="mb-6">
                <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
                  {ctrl.label}
                </label>
                <Slider
                  value={strokeWidthLocal}
                  min={ctrl.min}
                  max={ctrl.max}
                  step={ctrl.step}
                  onChange={setStrokeWidthLocal}
                />
                <span class="text-xs text-gray-500">{strokeWidthLocal}px</span>
              </section>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};
