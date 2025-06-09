import { useLayoutEffect, useRef } from 'react';

import { useViewportCapability } from './use-viewport';
import { Rect } from '@embedpdf/models';

export function useViewportRef() {
  const { provides: viewportProvides } = useViewportCapability();
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!viewportProvides) return;

    const container = containerRef.current;
    if (!container) return;

    /* ---------- live rect provider --------------------------------- */
    const provideRect = (): Rect => {
      const r = container.getBoundingClientRect();
      return {
        origin: { x: r.left, y: r.top },
        size: { width: r.width, height: r.height },
      };
    };
    viewportProvides.registerBoundingRectProvider(provideRect);

    // Example: On scroll, call setMetrics
    const onScroll = () => {
      viewportProvides.setViewportScrollMetrics({
        scrollTop: container.scrollTop,
        scrollLeft: container.scrollLeft,
      });
    };
    container.addEventListener('scroll', onScroll);

    // Example: On resize, call setMetrics
    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();

      viewportProvides.setViewportMetrics({
        width: container.offsetWidth,
        height: container.offsetHeight,
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight,
        scrollTop: container.scrollTop,
        scrollLeft: container.scrollLeft,
        scrollWidth: container.scrollWidth,
        scrollHeight: container.scrollHeight,
      });
    });
    resizeObserver.observe(container);

    const unsubscribeScrollRequest = viewportProvides.onScrollRequest(
      ({ x, y, behavior = 'auto' }) => {
        requestAnimationFrame(() => {
          container.scrollTo({ left: x, top: y, behavior });
        });
      },
    );

    // Cleanup
    return () => {
      viewportProvides.registerBoundingRectProvider(null);
      container.removeEventListener('scroll', onScroll);
      resizeObserver.disconnect();
      unsubscribeScrollRequest();
    };
  }, [viewportProvides]);

  // Return the ref so your React code can attach it to a div
  return containerRef;
}
