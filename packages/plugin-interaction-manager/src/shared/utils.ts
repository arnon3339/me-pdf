import { Position } from '@embedpdf/models';
import type {
  InteractionManagerCapability,
  InteractionScope,
  PointerEventHandlers,
  EmbedPdfPointerEvent,
} from '@embedpdf/plugin-interaction-manager';

type K = keyof PointerEventHandlers;
const domEventMap: Record<string, K> = {
  pointerdown: 'onPointerDown',
  pointerup: 'onPointerUp',
  pointermove: 'onPointerMove',
  pointerenter: 'onPointerEnter',
  pointerleave: 'onPointerLeave',
  pointercancel: 'onPointerCancel',
  click: 'onClick',
  dblclick: 'onDoubleClick',
  // Touch event mapping
  touchstart: 'onPointerDown',
  touchend: 'onPointerUp',
  touchmove: 'onPointerMove',
  touchcancel: 'onPointerCancel',
};

const pointerEventTypes = [
  'pointerdown',
  'pointerup',
  'pointermove',
  'pointerenter',
  'pointerleave',
  'pointercancel',
  'click',
  'dblclick',
];

const touchEventTypes = ['touchstart', 'touchend', 'touchmove', 'touchcancel'];

/**
 * Hook one DOM element into the interaction-manager.
 * – keeps handlers & cursor in-sync with the current mode
 * – returns a teardown fn for React/Preact effects
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
    /** ❖  Propagation rule
     * ─────────────────
     * • global provider updates its cursor *only* while the active
     * mode itself is ‘global’.
     * • page providers always sync (so they show the cursor during
     * a global mode as well). */
    if (scope.type === 'global') {
      const isGlobalMode = cap.getActiveInteractionMode()?.scope === 'global';
      if (!isGlobalMode) return; // active mode is page-scoped → ignore
    }
    element.style.cursor = c;
  });

  const toPos = (e: { clientX: number; clientY: number }, host: HTMLElement): Position => {
    if (convertEventToPoint) return convertEventToPoint(e as PointerEvent, host);
    const r = host.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  /* ------------------------------------------------------------------ */
  /* event wiring                                                       */
  /* ------------------------------------------------------------------ */
  const listeners: Record<string, (evt: Event) => void> = {};

  const handleEvent = (evt: Event) => {
    if (cap.isPaused()) return;

    const handlerKey = domEventMap[evt.type];
    if (!handlerKey || !active?.[handlerKey]) return;

    let pos: Position;
    let normalizedEvent: EmbedPdfPointerEvent & {
      target: EventTarget | null;
      currentTarget: EventTarget | null;
    };

    if (evt instanceof TouchEvent) {
      /** prevent scrolling and accidental double-tap zoom while
       *  the finger is MOVING (or the gesture gets cancelled)
       *  but leave touchstart / touchend alone so the browser can
       *  emit its synthetic click that React listens for. */
      if (evt.type === 'touchmove' || evt.type === 'touchcancel') {
        evt.preventDefault();
      }

      // For `touchend`, we must use `changedTouches` as `touches` will be empty.
      const touchPoint =
        evt.type === 'touchend' || evt.type === 'touchcancel'
          ? evt.changedTouches[0]
          : evt.touches[0];

      if (!touchPoint) return; // No touch points to process

      pos = toPos(touchPoint, element);
      normalizedEvent = {
        clientX: touchPoint.clientX,
        clientY: touchPoint.clientY,
        ctrlKey: evt.ctrlKey,
        shiftKey: evt.shiftKey,
        altKey: evt.altKey,
        metaKey: evt.metaKey,
        target: evt.target,
        currentTarget: evt.currentTarget,
      };
    } else {
      const pe = evt as PointerEvent;
      pos = toPos(pe, element);
      normalizedEvent = pe;
    }

    const currentModeId = cap.getActiveMode();
    active[handlerKey]?.(pos, normalizedEvent, currentModeId);
  };

  // Add both pointer and touch event listeners
  [...pointerEventTypes, ...touchEventTypes].forEach((type) => {
    listeners[type] = handleEvent;
    element.addEventListener(type, listeners[type], { passive: false });
  });

  /* ------------------------------------------------------------------ */
  /* teardown                                                           */
  /* ------------------------------------------------------------------ */
  return () => {
    Object.entries(listeners).forEach(([type, listener]) => {
      element.removeEventListener(type, listener);
    });
    stopMode();
    stopCursor();
    stopHandler();
  };
}
