import { useViewportPlugin } from './use-viewport';
export function useViewportRef() {
    const p = $derived(useViewportPlugin());
    let containerRef = $state(null);
    $effect.pre(() => {
        if (!p.plugin)
            return;
        const container = containerRef;
        if (!container)
            return;
        /* ---------- live rect provider --------------------------------- */
        const provideRect = () => {
            const r = container.getBoundingClientRect();
            return {
                origin: { x: r.left, y: r.top },
                size: { width: r.width, height: r.height }
            };
        };
        p.plugin.registerBoundingRectProvider(provideRect);
        // Example: On scroll, call setMetrics
        const onScroll = () => {
            p.plugin?.setViewportScrollMetrics({
                scrollTop: container.scrollTop,
                scrollLeft: container.scrollLeft
            });
        };
        container.addEventListener('scroll', onScroll);
        // Example: On resize, call setMetrics
        const resizeObserver = new ResizeObserver(() => {
            p.plugin?.setViewportResizeMetrics({
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
        const unsubscribeScrollRequest = p.plugin.onScrollRequest(({ x, y, behavior = 'auto' }) => {
            requestAnimationFrame(() => {
                container.scrollTo({ left: x, top: y, behavior });
            });
        });
        // Cleanup
        return () => {
            p.plugin?.registerBoundingRectProvider(null);
            container.removeEventListener('scroll', onScroll);
            resizeObserver.disconnect();
            unsubscribeScrollRequest();
        };
    });
    // Return the ref so your Svelte code can attach it to a div
    return {
        get containerRef() {
            return containerRef;
        },
        set containerRef(el) {
            containerRef = el;
        }
    };
}
