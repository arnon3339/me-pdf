import { useEffect, useMemo, useRef } from 'react';
import type { PointerEventHandlers } from '@embedpdf/plugin-interaction-manager';
import { useCursor, usePointerHandlers } from '@embedpdf/plugin-interaction-manager/react';
import { useViewportCapability } from '@embedpdf/plugin-viewport/react';

export const PanMode = () => {
  const { register } = usePointerHandlers({ modeId: 'panMode' });
  const { setCursor, removeCursor } = useCursor();
  const { provides: viewport } = useViewportCapability();

  const dragRef = useRef<{
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  const handlers = useMemo(
    (): PointerEventHandlers => ({
      onPointerDown: (_, pe) => {
        if (!viewport) return;

        const metrics = viewport.getMetrics();

        dragRef.current = {
          startX: pe.clientX,
          startY: pe.clientY,
          startLeft: metrics.scrollLeft,
          startTop: metrics.scrollTop,
        };

        setCursor('panMode', 'grabbing', 10);
      },
      onPointerMove: (_, pe) => {
        const drag = dragRef.current;
        if (!drag || !viewport) return;

        /* delta between current pointer position and where the drag started */
        const dx = pe.clientX - drag.startX;
        const dy = pe.clientY - drag.startY;

        viewport.scrollTo({
          x: drag.startLeft - dx,
          y: drag.startTop - dy,
        });
      },
      onPointerUp: () => {
        const drag = dragRef.current;
        if (!drag) return;

        dragRef.current = null;
        removeCursor('panMode');
      },
      onPointerLeave: () => {
        const drag = dragRef.current;
        if (!drag) return;

        dragRef.current = null;
        removeCursor('panMode');
      },
      onPointerCancel: () => {
        const drag = dragRef.current;
        if (!drag) return;

        dragRef.current = null;
        removeCursor('panMode');
      },
    }),
    [viewport, setCursor, removeCursor],
  );

  useEffect(() => {
    if (!register) return;
    return register(handlers);
  }, [register, handlers]);

  return <></>;
};
