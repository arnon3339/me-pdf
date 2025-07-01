/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { PointerEventHandlers } from '@embedpdf/plugin-interaction-manager';
import { usePointerHandlers } from '@embedpdf/plugin-interaction-manager/preact';
import { Rect } from '@embedpdf/models';

import { useCaptureCapability } from '../hooks/use-capture';

interface MarqueeCaptureProps {
  /** Index of the page this layer lives on */
  pageIndex: number;
  /** Scale of the page */
  scale: number;
  /** Width of the page */
  pageWidth: number;
  /** Height of the page */
  pageHeight: number;
  /** Optional CSS class applied to the marquee rectangle */
  className?: string;
  /** Stroke / fill colours (defaults below) */
  stroke?: string;
  fill?: string;
}

/**
 * Draws a marquee rectangle while the user drags.
 * Hook it into the interaction-manager with modeId = 'marqueeCapture'.
 */
export const MarqueeCapture = ({
  pageIndex,
  scale,
  pageWidth,
  pageHeight,
  className,
  stroke = 'rgba(33,150,243,0.8)',
  fill = 'rgba(33,150,243,0.15)',
}: MarqueeCaptureProps) => {
  /* ------------------------------------------------------------------ */
  /* capture capability                                                */
  /* ------------------------------------------------------------------ */
  const { provides: capture } = useCaptureCapability();

  /* ------------------------------------------------------------------ */
  /* integration with interaction-manager                               */
  /* ------------------------------------------------------------------ */
  const { register } = usePointerHandlers({ modeId: 'marqueeCapture', pageIndex });

  /* ------------------------------------------------------------------ */
  /* helpers                                                            */
  /* ------------------------------------------------------------------ */
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  /* ------------------------------------------------------------------ */
  /* local state – start / current drag position                        */
  /* ------------------------------------------------------------------ */
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  /* page size in **PDF-space** (unscaled) ----------------------------- */
  const pageWidthPDF = pageWidth / scale;
  const pageHeightPDF = pageHeight / scale;

  /* ------------------------------------------------------------------ */
  /* pointer handlers                                                   */
  /* ------------------------------------------------------------------ */
  const handlers = useMemo<PointerEventHandlers<PointerEvent>>(
    () => ({
      onPointerDown: (pos, evt) => {
        startRef.current = pos;
        setRect({ origin: { x: pos.x, y: pos.y }, size: { width: 0, height: 0 } });
        (evt.target as HTMLElement)?.setPointerCapture?.(evt.pointerId);
      },
      onPointerMove: (pos) => {
        if (!startRef.current) return;
        /* clamp current position to the page bounds */
        const curX = clamp(pos.x, 0, pageWidthPDF);
        const curY = clamp(pos.y, 0, pageHeightPDF);

        const { x: sx, y: sy } = startRef.current;
        const left = Math.min(sx, curX);
        const top = Math.min(sy, curY);
        const width = Math.abs(curX - sx);
        const height = Math.abs(curY - sy);

        setRect({ origin: { x: left, y: top }, size: { width, height } });
      },
      onPointerUp: (_, evt) => {
        if (rect && capture) {
          const dragPx = Math.max(rect.size.width, rect.size.height) * scale;
          if (dragPx > 5) {
            // real drag → zoom to it
            capture.captureArea(pageIndex, rect);
          }
        }

        startRef.current = null;
        setRect(null);
        (evt.target as HTMLElement)?.releasePointerCapture?.(evt.pointerId);
      },
      onPointerCancel: (_, evt) => {
        startRef.current = null;
        setRect(null);
        (evt.target as HTMLElement)?.releasePointerCapture?.(evt.pointerId);
      },
    }),
    [pageWidthPDF, pageWidthPDF, capture, scale, rect, pageIndex],
  );

  /* register with the interaction-manager */
  useEffect(() => {
    if (!register) return;
    return register(handlers);
  }, [register, handlers]);

  /* ------------------------------------------------------------------ */
  /* render                                                              */
  /* ------------------------------------------------------------------ */
  if (!rect) return null; // nothing to draw

  return (
    <div
      /* Each page wrapper is position:relative, so absolute is fine */
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        left: rect.origin.x * scale,
        top: rect.origin.y * scale,
        width: rect.size.width * scale,
        height: rect.size.height * scale,
        border: `1px solid ${stroke}`,
        background: fill,
        boxSizing: 'border-box',
      }}
      className={className}
    />
  );
};
