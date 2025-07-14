import { Position } from '@embedpdf/models';
import type {
  InteractionManagerCapability,
  InteractionScope,
  PointerEventHandlers,
} from '@embedpdf/plugin-interaction-manager';

/**
 * Hook one DOM element into the interaction-manager.
 *  – keeps handlers & cursor in-sync with the current mode
 *  – returns a teardown fn for React/Preact effects
 */
export function createPointerProvider(
  cap: InteractionManagerCapability,
  scope: InteractionScope,
  element: HTMLElement,
  convertEventToPoint?: (evt: PointerEvent, host: HTMLElement) => Position,
) {
  /* ------------------------------------------------------------------ */
  /* active handler set – hot-swapped on every mode change              */
  /* ------------------------------------------------------------------ */
  let active: PointerEventHandlers | null = cap.getHandlersForScope(scope);

  const stopMode = cap.onModeChange(() => {
    if (scope.type === 'global') {
      const mode = cap.getActiveInteractionMode();
      element.style.cursor = mode?.scope === 'global' ? (mode.cursor ?? 'auto') : 'auto';
    }
    active = cap.getHandlersForScope(scope);
  });

  const stopHandler = cap.onHandlerChange(() => {
    active = cap.getHandlersForScope(scope);
  });

  /* ------------------------------------------------------------------ */
  /* cursor                                                             */
  /* ------------------------------------------------------------------ */
  const modeNow = cap.getActiveInteractionMode();
  const cursorNow = cap.getCurrentCursor();

  /** initial cursor -------------------------------------------------- */
  if (scope.type === 'global') {
    // global wrapper only shows the cursor while a *global* mode is active
    element.style.cursor = modeNow?.scope === 'global' ? cursorNow : 'auto';
  } else {
    // page wrappers always mirror the latest cursor
    element.style.cursor = cursorNow;
  }

  const stopCursor = cap.onCursorChange((c) => {
    /**  ❖  Propagation rule
     *      ─────────────────
     *   • global provider updates its cursor *only* while the active
     *     mode itself is ‘global’.
     *   • page providers always sync (so they show the cursor during
     *     a global mode as well). */
    if (scope.type === 'global') {
      const isGlobalMode = cap.getActiveInteractionMode()?.scope === 'global';
      if (!isGlobalMode) return; // active mode is page-scoped → ignore
    }
    element.style.cursor = c;
  });

  /* ------------------------------------------------------------------ */
  /* event wiring                                                       */
  /* ------------------------------------------------------------------ */
  type K = keyof PointerEventHandlers;
  const domEvent: Record<K, keyof HTMLElementEventMap> = {
    onPointerDown: 'pointerdown',
    onPointerUp: 'pointerup',
    onPointerMove: 'pointermove',
    onPointerEnter: 'pointerenter',
    onPointerLeave: 'pointerleave',
    onPointerCancel: 'pointercancel',
  };

  /* one stable EventListener per key -> needed for removeEventListener */
  const listeners: Partial<Record<K, EventListener>> = {};

  const toPos = (e: PointerEvent, host: HTMLElement): Position => {
    if (convertEventToPoint) return convertEventToPoint(e, host);
    const r = host.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  (Object.keys(domEvent) as K[]).forEach((k) => {
    listeners[k] = (evt: Event) => {
      if (cap.isPaused()) return;

      const pe = evt as PointerEvent; // safe – we only attach to pointer*
      const currentModeId = cap.getActiveMode();
      active?.[k]?.(toPos(pe, element), pe, currentModeId);
      /* if you need to stop default behaviour when no handler is active:
       * if (!active?.[k]) pe.preventDefault(); */
    };
    element.addEventListener(domEvent[k], listeners[k]!);
  });

  /* ------------------------------------------------------------------ */
  /* teardown                                                           */
  /* ------------------------------------------------------------------ */
  return () => {
    (Object.keys(domEvent) as K[]).forEach((k) =>
      element.removeEventListener(domEvent[k], listeners[k]!),
    );
    stopMode();
    stopCursor();
    stopHandler();
  };
}
