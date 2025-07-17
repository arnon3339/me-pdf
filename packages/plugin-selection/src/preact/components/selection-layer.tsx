/** @jsxImportSource preact */
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ignore, PdfErrorCode, PdfPageGeometry, Position, Rect } from '@embedpdf/models';
import {
  useCursor,
  useInteractionManagerCapability,
  usePointerHandlers,
} from '@embedpdf/plugin-interaction-manager/preact';
import { PointerEventHandlersWithLifecycle } from '@embedpdf/plugin-interaction-manager';
import { glyphAt } from '@embedpdf/plugin-selection';

import { useSelectionCapability } from '../hooks';

type Props = {
  pageIndex: number;
  scale: number;
  background?: string;
};

export function SelectionLayer({ pageIndex, scale, background = 'rgba(33,150,243)' }: Props) {
  const { provides: sel } = useSelectionCapability();
  const { provides: im } = useInteractionManagerCapability();
  const { register } = usePointerHandlers({ pageIndex });
  const [rects, setRects] = useState<Array<Rect>>([]);
  const [boundingRect, setBoundingRect] = useState<Rect | null>(null);
  const { setCursor, removeCursor } = useCursor();
  const geoCacheRef = useRef<PdfPageGeometry | null>(null);

  /* subscribe to rect updates */
  useEffect(() => {
    if (!sel) return;
    return sel.onSelectionChange(() => {
      const mode = im?.getActiveMode();
      if (mode === 'default') {
        setRects(sel.getHighlightRectsForPage(pageIndex));
        setBoundingRect(sel.getBoundingRectForPage(pageIndex));
      } else {
        setRects([]);
        setBoundingRect(null);
      }
    });
  }, [sel, pageIndex]);

  /* cheap glyphAt cache for the active page */
  const cachedGlyphAt = useCallback((pt: Position) => {
    const geo = geoCacheRef.current;
    return geo ? glyphAt(geo, pt) : -1;
  }, []);

  // Initialize geometry cache
  useEffect(() => {
    if (!sel) return;
    const task = sel.getGeometry(pageIndex);
    task.wait((g) => (geoCacheRef.current = g), ignore);

    return () => {
      task.abort({
        code: PdfErrorCode.Cancelled,
        message: 'Cancelled',
      });
      geoCacheRef.current = null;
    };
  }, [sel, pageIndex]);

  const handlers = useMemo(
    (): PointerEventHandlersWithLifecycle<PointerEvent> => ({
      onPointerDown: (point, _evt, modeId) => {
        if (!sel) return;
        if (!sel.isEnabledForMode(modeId)) return;
        // clear the selection
        sel.clear();
        const task = sel.getGeometry(pageIndex);
        task.wait((geo) => {
          const g = glyphAt(geo, point);
          if (g !== -1) sel.begin(pageIndex, g);
        }, ignore);
      },
      onPointerMove: (point, _evt, modeId) => {
        if (!sel) return;
        if (!sel.isEnabledForMode(modeId)) return;
        const g = cachedGlyphAt(point);
        if (g !== -1) {
          setCursor('selection-text', 'text', 10);
        } else {
          removeCursor('selection-text');
        }
        if (g !== -1) sel.update(pageIndex, g);
      },
      onPointerUp: (_point, _evt, modeId) => {
        if (!sel) return;
        if (!sel.isEnabledForMode(modeId)) return;
        sel.end();
      },
      onHandlerActiveEnd(modeId) {
        if (!sel) return;
        if (!sel.isEnabledForMode(modeId)) return;

        sel.clear();
      },
    }),
    [sel, pageIndex, cachedGlyphAt],
  );

  useEffect(() => {
    if (!register) return;
    return register(handlers);
  }, [register, handlers]);

  if (!boundingRect) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: boundingRect.origin.x * scale,
        top: boundingRect.origin.y * scale,
        width: boundingRect.size.width * scale,
        height: boundingRect.size.height * scale,
        mixBlendMode: 'multiply',
        isolation: 'isolate',
      }}
    >
      {rects.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: (b.origin.x - boundingRect.origin.x) * scale,
            top: (b.origin.y - boundingRect.origin.y) * scale,
            width: b.size.width * scale,
            height: b.size.height * scale,
            background,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
