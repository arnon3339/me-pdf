// Tooltip.tsx  (patched), Fragment
import { h, ComponentChildren, Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  computePosition,
  offset,
  flip,
  shift,
  arrow as arrowMw,
  autoUpdate,
  Placement,
} from '@floating-ui/dom';

interface TooltipProps {
  children: ComponentChildren;
  content: ComponentChildren;
  position?: Placement;
  className?: string;
  delay?: number;
  style?: 'light' | 'dark';
  trigger?: 'hover' | 'click' | 'none';
}

export function Tooltip({
  children,
  content,
  position = 'top',
  className = '',
  delay = 200,
  style = 'dark',
  trigger = 'hover',
}: TooltipProps) {
  const reference = useRef<HTMLDivElement>(null);
  const floating  = useRef<HTMLDivElement>(null);
  const arrow     = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const st  = useRef<NodeJS.Timeout | null>(null);

  /* ── position ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!reference.current || !floating.current) return;

    return autoUpdate(reference.current, floating.current, () => {
      computePosition(reference.current!, floating.current!, {
        placement: position,
        middleware: [
          offset(8),
          flip(),
          shift({ padding: 8 }),
          arrowMw({ element: arrow.current!, padding: 6 }),
        ],
      }).then(({ x, y, placement, middlewareData }) => {
        Object.assign(floating.current!.style, { left: `${x}px`, top: `${y}px` });

        const { x: ax, y: ay } = middlewareData.arrow ?? {};
        const side = placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right';
        const staticSide = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side];

        /* --- **critical change**: clear the axis we don’t use --- */
        Object.assign(arrow.current!.style, {
          left  : ax != null ? `${ax}px` : '',
          top   : ay != null ? `${ay}px` : '',
          right : '',
          bottom: '',
          [staticSide!]: '-4px',
        });
      });
    });
  }, [position, visible]);

  /* ── trigger wiring ───────────────────────────────────────────────── */
  useEffect(() => {
    const refEl = reference.current;
    const floatEl = floating.current;
    if (!refEl || !floatEl) return;

    /* helpers */
    const clear = () => {
      if (st.current) clearTimeout(st.current);
    };
    const show   = () => { clear(); st.current = setTimeout(() => setVisible(true ), delay); };
    const hide = () => { clear(); setVisible(false); };
    const toggle = () => setVisible(v => !v);

    /* attach based on *current* trigger prop */
    if (trigger === 'hover') {
      refEl.addEventListener('mouseenter', show);
      refEl.addEventListener('mouseleave', hide);
      floatEl.addEventListener('mouseenter', show);
      floatEl.addEventListener('mouseleave', hide);
      refEl.addEventListener('pointerdown', hide);
    } else if (trigger === 'click') {
      refEl.addEventListener('click', toggle);
    }
    /* “none” ⇒ nothing attached */

    if (trigger === 'none') {
      /* cancel any pending timers */
      if (st.current) clearTimeout(st.current);
      /* instantly hide bubble */
      setVisible(false);
    }

    /* detach when `trigger` changes or component unmounts */
    return () => {
      clear();
      if (trigger === 'hover') {
        refEl.removeEventListener('mouseenter', show);
        refEl.removeEventListener('mouseleave', hide);
        floatEl.removeEventListener('mouseenter', show);
        floatEl.removeEventListener('mouseleave', hide);
        refEl.removeEventListener('pointerdown', hide);
      } else if (trigger === 'click') {
        refEl.removeEventListener('click', toggle);
      }
    };
  }, [trigger, delay]);  

  /* ── render ───────────────────────────────────────────────────────── */
  return (
    <Fragment>
      <div ref={reference} className="inline-block">{children}</div>

      <div
        ref={floating}
        role="tooltip"
        className={`
          absolute z-100 px-3 py-2 rounded-lg text-sm shadow-md
          pointer-events-none select-none transition-opacity duration-150
          whitespace-nowrap                       /* <── NEW */
          ${style === 'dark'
            ? 'bg-gray-900 text-white'
            : 'bg-white text-gray-900 border border-gray-200'}
          ${visible ? 'opacity-100' : 'opacity-0'}
          ${className}
        `}
        style={{ visibility: visible ? 'visible' : 'hidden' }}
      >
        {content}
        {/* the arrow inherits background so it never mismatches */}
        <div
          ref={arrow}
          className={`
            absolute h-2 w-2 rotate-45 bg-inherit
            ${style === 'light' ? 'border border-gray-200' : ''}
          `}
        />
      </div>
    </Fragment>
  );
}
