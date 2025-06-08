import { useLayoutEffect, useRef } from 'preact/hooks';

import { useViewportCapability } from './use-viewport';

export function useViewportRef() {
  const { provides: viewportProvides } = useViewportCapability();
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!viewportProvides) return;

    const container = containerRef.current;
    if (!container) return;

    /* ---------- live rect provider --------------------------------- */
    const provideRect = () => {
      const r = container.getBoundingClientRect();
      return {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
      };
    };
    viewportProvides.registerRectProvider(provideRect);

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
      viewportProvides.registerRectProvider(null);
      container.removeEventListener('scroll', onScroll);
      resizeObserver.disconnect();
      unsubscribeScrollRequest();
    };
  }, [viewportProvides]);

  // Return the ref so your React code can attach it to a div
  return containerRef;
}
