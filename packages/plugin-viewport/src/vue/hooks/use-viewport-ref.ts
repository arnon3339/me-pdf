import { Rect } from '@embedpdf/models';
import { onMounted, onUnmounted, ref } from 'vue';

import { useViewportPlugin } from './use-viewport';

export function useViewportRef() {
  const { plugin: pluginRef } = useViewportPlugin();
  const containerRef = ref<HTMLDivElement | null>(null);

  onMounted(() => {
    const viewportPlugin = pluginRef.value;
    const container = containerRef.value;
    if (!container || !viewportPlugin) return;

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

    onUnmounted(() => {
      viewportPlugin.registerBoundingRectProvider(null);
      container.removeEventListener('scroll', onScroll);
      resizeObserver.disconnect();
      unsubscribeScrollRequest();
    });
  });

  // Return the ref so your Vue code can attach it to a div
  return containerRef;
}
