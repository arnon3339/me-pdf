import { Rect } from '@embedpdf/models';
import { useLayoutEffect, useRef } from '@framework';

import { useViewportPlugin } from './use-viewport';

export function useViewportRef() {
  const { plugin: viewportPlugin } = useViewportPlugin();
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!viewportPlugin) return;

    const container = containerRef.current;
    if (!container) return;

    let cleanedUp = false;

    /* ---------- live rect provider --------------------------------- */
    const provideRect = (): Rect => {
      const r = container.getBoundingClientRect();
      return {
        origin: { x: r.left, y: r.top },
        size: { width: r.width, height: r.height },
      };
    };
    viewportPlugin.registerBoundingRectProvider(provideRect);

    // Example: On scroll, call setMetrics
    const onScroll = () => {
      viewportPlugin.setViewportScrollMetrics({
        scrollTop: container.scrollTop,
        scrollLeft: container.scrollLeft,
      });
    };
    container.addEventListener('scroll', onScroll);

    // Example: On resize, call setMetrics
    const resizeObserver = new ResizeObserver(() => {
      if (cleanedUp) return;
      viewportPlugin.setViewportResizeMetrics({
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

    const unsubscribeScrollRequest = viewportPlugin.onScrollRequest(
      ({ x, y, behavior = 'auto' }) => {
        requestAnimationFrame(() => {
          container.scrollTo({ left: x, top: y, behavior });
        });
      },
    );

    // Cleanup
    return () => {
      cleanedUp = true;
      resizeObserver.disconnect();
      viewportPlugin.registerBoundingRectProvider(null);
      container.removeEventListener('scroll', onScroll);
      unsubscribeScrollRequest();
    };
  }, [viewportPlugin]);

  // Return the ref so your React code can attach it to a div
  return containerRef;
}
