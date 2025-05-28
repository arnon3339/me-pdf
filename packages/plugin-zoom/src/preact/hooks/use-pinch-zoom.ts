import { useEffect, useRef } from 'preact/hooks';
import { useCapability } from '@embedpdf/core/preact';
import { ViewportPlugin } from '@embedpdf/plugin-viewport';
import { ZoomState } from '@embedpdf/plugin-zoom';

import { useZoomCapability } from './use-zoom';

export function usePinch() {
  const { provides: viewportProvides } = useCapability<ViewportPlugin>('viewport');
  const { provides: zoomProvides } = useZoomCapability();
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !viewportProvides || !zoomProvides) {
      return;
    }

    // Check if we're on the client side
    if (typeof window === 'undefined') {
      return;
    }

    let hammer: any | undefined;
    let initialZoom = 0; // numeric scale at pinchstart
    let lastCenter = { x: 0, y: 0 };

    const getState = (): ZoomState => zoomProvides.getState();

    const updateTransform = (scale: number) => {
      // 1 → no scale; we only scale *relatively* to the start
      element.style.transform = `scale(${scale})`;
    };

    const resetTransform = () => {
      element.style.transform = 'none';
      element.style.transformOrigin = '0 0';
    };

    const pinchStart = (e: HammerInput) => {
      initialZoom = getState().currentZoomLevel;

      const contRect = viewportProvides.getMetrics();
      lastCenter = {
        x: e.center.x - contRect.rect.left,
        y: e.center.y - contRect.rect.top,
      };

      // put the transform-origin under the fingers so the preview feels right
      const innerRect = element.getBoundingClientRect();
      element.style.transformOrigin = `${e.center.x - innerRect.left}px ${e.center.y - innerRect.top}px`;

      // stop the browser’s own pinch-zoom
      if (e.srcEvent?.cancelable) {
        e.srcEvent.preventDefault();
        e.srcEvent.stopPropagation();
      }
    };

    const pinchMove = (e: HammerInput) => {
      updateTransform(e.scale); // *only* CSS, no real zoom yet
      if (e.srcEvent?.cancelable) {
        e.srcEvent.preventDefault();
        e.srcEvent.stopPropagation();
      }
    };

    const pinchEnd = (e: HammerInput) => {
      // translate the relative hammer scale into a delta for requestZoomBy
      const delta = (e.scale - 1) * initialZoom;
      zoomProvides.requestZoomBy(delta, { vx: lastCenter.x, vy: lastCenter.y });

      resetTransform();
      initialZoom = 0;
    };

    // Dynamically import and setup Hammer
    const setupHammer = async () => {
      try {
        const Hammer = (await import('hammerjs')).default;

        /* ------------------------------------------------------------------ */
        /* Hammer setup                                                        */
        /* ------------------------------------------------------------------ */
        const inputClass = (() => {
          const MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;
          const SUPPORT_TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
          const SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);
          if (SUPPORT_ONLY_TOUCH) return Hammer.TouchInput;
          if (!SUPPORT_TOUCH) return Hammer.MouseInput;
          return Hammer.TouchMouseInput;
        })();

        hammer = new Hammer(element, {
          touchAction: 'pan-x pan-y', // allow scroll in every direction
          inputClass,
        });

        hammer.get('pinch').set({ enable: true, pointers: 2, threshold: 0.1 });

        hammer.on('pinchstart', pinchStart);
        hammer.on('pinchmove', pinchMove);
        hammer.on('pinchend', pinchEnd);
      } catch (error) {
        console.warn('Failed to load HammerJS:', error);
      }
    };

    setupHammer();

    return () => {
      hammer?.destroy();
      resetTransform();
    };
  }, [viewportProvides, zoomProvides]);

  return { elementRef };
}
