import { useLayoutEffect, useRef } from "preact/hooks";
import { useViewport } from "./use-viewport"; 

export function useViewportRef() {
  const viewport = useViewport();
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!viewport) return;

    const container = containerRef.current;
    if (!container) return;

    // Example: On scroll, call setMetrics
    const onScroll = () => {
      viewport.setViewportScrollMetrics({
        scrollTop: container.scrollTop,
        scrollLeft: container.scrollLeft
      });
    }
    container.addEventListener("scroll", onScroll);
    
    // Example: On resize, call setMetrics
    const resizeObserver = new ResizeObserver(() => {
      viewport.setViewportMetrics({
        width: container.offsetWidth,
        height: container.offsetHeight,
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight,
        scrollTop: container.scrollTop,
        scrollLeft: container.scrollLeft,
        scrollWidth: container.scrollWidth,
        scrollHeight: container.scrollHeight
      });
    });
    resizeObserver.observe(container);

    const unsubscribeScrollRequest = viewport.onScrollRequest(({ x, y, behavior='auto' }) => {
      requestAnimationFrame(() => {
        container.scrollTo({ left: x, top: y, behavior });
      });
    });

    // Cleanup
    return () => {
      container.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
      unsubscribeScrollRequest();
    };
  }, [viewport]);

  // Return the ref so your React code can attach it to a div
  return containerRef;
}