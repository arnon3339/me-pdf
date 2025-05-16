/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import { PdfGlyphObject } from '@embedpdf/models';
import { SelectionRange } from '@embedpdf/plugin-selection';
import { useSelectionCapability } from '../hooks';

type Props = {
  pageIndex: number;
  scale: number;
};

export function SelectionLayer({ pageIndex, scale }: Props) {
  const {
    provides: selection,
  } = useSelectionCapability();
  const [glyphs, setGlyphs] = useState<PdfGlyphObject[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* ── load glyphs once ─────────────────────────────────── */
  useEffect(() => {
    selection?.getPageGlyphs(pageIndex).then(setGlyphs);
  }, [pageIndex]);

  /* ── geometry helpers ─────────────────────────────────── */
  const inRect = (
    pt: { x: number; y: number },
    g: PdfGlyphObject,
  ) =>
    pt.x >= g.origin.x &&
    pt.x <= g.origin.x + g.size.width &&
    pt.y >= g.origin.y &&
    pt.y <= g.origin.y + g.size.height;

  const glyphAt = (pt: { x: number; y: number }) => {
    for (let i = 0; i < glyphs.length; i++) if (inRect(pt, glyphs[i])) return i;
    return -1;
  };

  /* ── interaction state ────────────────────────────────── */
  const selRef = useRef<SelectionRange | null>(null);
  const anchorRef = useRef<number | null>(null);
  const dragging = useRef(false);

  /* ── pointer handlers ─────────────────────────────────── */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !glyphs.length) return;

    const toPt = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      console.log('toPt', r);
      console.log('e', e);
      return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
    };

    const onDown = (e: PointerEvent) => {
      if (e.button) return;
      console.log('onDown', toPt(e));
      const g = glyphAt(toPt(e));
      if (g === -1) return;
      anchorRef.current = g;
      dragging.current = true;
      wrap.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const g = glyphAt(toPt(e));
      if (g === -1) return;
      selRef.current = {
        start: Math.min(anchorRef.current!, g),
        end: Math.max(anchorRef.current!, g),
      };
      drawSelection();
    };

    const onUp = (e: PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      wrap.releasePointerCapture(e.pointerId);
      selection?.setSelection(pageIndex, selRef.current);
    };

    wrap.addEventListener('pointerdown', onDown);
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerup', onUp);
    return () => {
      wrap.removeEventListener('pointerdown', onDown);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerup', onUp);
    };
  }, [glyphs, scale]);

  /* ── draw highlight via inline divs (cheap) ───────────── */
  const [boxes, setBoxes] = useState<any[]>([]);
  function drawSelection() {
    const sel = selRef.current;
    if (!sel) return setBoxes([]);
    const out = [];
    for (let i = sel.start; i <= sel.end; i++) {
      const g = glyphs[i];
      out.push({
        x: g.origin.x,
        y: g.origin.y,
        w: g.size.width,
        h: g.size.height,
      });
    }
    setBoxes(out);
  }

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }}>
      {boxes.map((b) => (
        <div
          style={{
            position: 'absolute',
            left: b.x * scale,
            top: b.y * scale,
            width: b.w * scale,
            height: b.h * scale,
            background: 'rgba(33,150,243,.28)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
