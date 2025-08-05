import { useEffect, useMemo, useRef } from '@framework';
import type { PointerEventHandlers } from '@embedpdf/plugin-interaction-manager';
import { useCursor, usePointerHandlers } from '@embedpdf/plugin-interaction-manager/@framework';
import { useViewportCapability } from '@embedpdf/plugin-viewport/@framework';
import { usePanCapability, usePanPlugin } from '../hooks';

export const PanMode = () => {
  const { register } = usePointerHandlers({ modeId: 'panMode' });
  const { setCursor, removeCursor } = useCursor();
  const { provides: viewport } = useViewportCapability();
  const { provides: pan } = usePanCapability();
  const { plugin: panPlugin } = usePanPlugin();

  const dragRef = useRef<{
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  useEffect(() => {
    if (!pan || !panPlugin) return;

    const mode = panPlugin.config?.defaultMode ?? 'never';
    const SUPPORT_TOUCH =
      typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    if (mode === 'mobile' && SUPPORT_TOUCH) {
      pan.makePanDefault();
    }
  }, [pan, panPlugin]);

  const handlers = useMemo(
    (): PointerEventHandlers => ({
      onMouseDown: (_, pe) => {
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
      onMouseMove: (_, pe) => {
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
      onMouseUp: () => {
        const drag = dragRef.current;
        if (!drag) return;

        dragRef.current = null;
        removeCursor('panMode');
      },
      onMouseLeave: () => {
        const drag = dragRef.current;
        if (!drag) return;

        dragRef.current = null;
        removeCursor('panMode');
      },
      onMouseCancel: () => {
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
