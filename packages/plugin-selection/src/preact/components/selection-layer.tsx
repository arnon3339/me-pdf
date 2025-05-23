/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import { useSelectionCapability } from '../hooks';
import { glyphAt } from '@embedpdf/plugin-selection';
import { PdfPageGeometry, Rect, restorePosition, Rotation, Size } from '@embedpdf/models';

type Props = { pageIndex: number; scale: number; rotation: Rotation; containerSize: Size };

export function SelectionLayer({ pageIndex, scale, rotation, containerSize }: Props) {
  const { provides: sel } = useSelectionCapability();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [rects, setRects] = useState<Array<Rect>>([]);
  const [hoveringText, setHoveringText] = useState(false);

  /* subscribe to rect updates */
  useEffect(() => {
    if (!sel) return;
    return sel.onSelectionChange(() => {
      setRects(sel.getHighlightRects(pageIndex));
    });
  }, [sel, pageIndex]);

  /* pointer interaction (framework-specific, but tiny) */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !sel) return;
    const toPt = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const disp = { x: e.clientX - r.left, y: e.clientY - r.top };

      return restorePosition(containerSize, disp, rotation, scale);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button) return;

      // clear the selection
      sel.clear();
      sel.getGeometry(pageIndex).then((geo) => {
        const g = glyphAt(geo, toPt(e));
        if (g !== -1) sel.begin(pageIndex, g);
      });
      wrap.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!sel) return;
      const g = cachedGlyphAt(toPt(e));
      setHoveringText(g !== -1);
      if (g !== -1) sel.update(pageIndex, g);
    };
    const onUp = () => sel.end();

    /* cheap glyphAt cache for the active page */
    let geoCache: PdfPageGeometry | undefined;
    const cachedGlyphAt = (pt: { x: number; y: number }) => {
      if (!geoCache) return -1;
      return glyphAt(geoCache, pt);
    };
    sel.getGeometry(pageIndex).then((g) => (geoCache = g));

    wrap.addEventListener('pointerdown', onDown);
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerup', onUp);
    return () => {
      wrap.removeEventListener('pointerdown', onDown);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerup', onUp);
    };
  }, [sel, pageIndex, scale]);

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        inset: 0,
        mixBlendMode: 'multiply',
        isolation: 'isolate',
        cursor: hoveringText ? 'text' : 'default',
      }}
    >
      {rects.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.origin.x * scale,
            top: b.origin.y * scale,
            width: b.size.width * scale,
            height: b.size.height * scale,
            background: 'rgba(33,150,243)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
