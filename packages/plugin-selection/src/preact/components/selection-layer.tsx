/** @jsxImportSource preact */
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useSelectionCapability } from '../hooks';
import { glyphAt } from '@embedpdf/plugin-selection';
import { ignore, PdfErrorCode, PdfPageGeometry, Rect } from '@embedpdf/models';
import { useCursor, usePointerHandlers } from '@embedpdf/plugin-interaction-manager/preact';
import { PointerEventHandlers } from '@embedpdf/plugin-interaction-manager';

type Props = { pageIndex: number; scale: number };

export function SelectionLayer({ pageIndex, scale }: Props) {
  const { provides: sel } = useSelectionCapability();
  const { register } = usePointerHandlers({ modeId: 'default', pageIndex });
  const [rects, setRects] = useState<Array<Rect>>([]);
  const { setCursor, removeCursor } = useCursor();

  /* subscribe to rect updates */
  useEffect(() => {
    if (!sel) return;
    return sel.onSelectionChange(() => {
      setRects(sel.getHighlightRects(pageIndex));
    });
  }, [sel, pageIndex]);

  /* cheap glyphAt cache for the active page */
  let geoCache: PdfPageGeometry | undefined;
  const cachedGlyphAt = useCallback((pt: { x: number; y: number }) => {
    if (!geoCache) return -1;
    return glyphAt(geoCache, pt);
  }, []);

  // Initialize geometry cache
  useEffect(() => {
    if (!sel) return;
    const task = sel.getGeometry(pageIndex);
    task.wait((g) => (geoCache = g), ignore);

    return () => {
      task.abort({
        code: PdfErrorCode.Cancelled,
        message: 'Cancelled',
      });
    };
  }, [sel, pageIndex]);

  const handlers = useMemo(
    (): PointerEventHandlers => ({
      onPointerDown: (point) => {
        if (!sel) return;

        // clear the selection
        sel.clear();
        const task = sel.getGeometry(pageIndex);
        task.wait((geo) => {
          const g = glyphAt(geo, point);
          if (g !== -1) sel.begin(pageIndex, g);
        }, ignore);
      },
      onPointerMove: (point) => {
        if (!sel) return;
        const g = cachedGlyphAt(point);
        if (g !== -1) {
          setCursor('selection-text', 'text', 10);
        } else {
          removeCursor('selection-text');
        }
        if (g !== -1) sel.update(pageIndex, g);
      },
      onPointerUp: () => {
        if (!sel) return;
        sel.end();
      },
    }),
    [sel, pageIndex, cachedGlyphAt],
  );

  useEffect(() => {
    if (!register) return;
    return register(handlers);
  }, [register, handlers]);

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
            background: 'rgba(33,150,243)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}
