import { useEffect, useState } from '@framework';
import { Rect } from '@embedpdf/models';

import { useRedactionPlugin } from '../hooks/use-redaction';

interface MarqueeRedactProps {
  /** Index of the page this layer lives on */
  pageIndex: number;
  /** Scale of the page */
  scale: number;
  /** Optional CSS class applied to the marquee rectangle */
  className?: string;
  /** Stroke / fill colours (defaults below) */
  stroke?: string;
  fill?: string;
}

/**
 * Draws a marquee rectangle while the user drags.
 * Hook it into the interaction-manager with modeId = 'marqueeZoom'.
 */
export const MarqueeRedact = ({
  pageIndex,
  scale,
  className,
  stroke = 'red',
  fill = 'transparent',
}: MarqueeRedactProps) => {
  /* ------------------------------------------------------------------ */
  /* zoom capability                                                   */
  /* ------------------------------------------------------------------ */
  const { plugin: redactionPlugin } = useRedactionPlugin();

  /* ------------------------------------------------------------------ */
  const [rect, setRect] = useState<Rect | null>(null);

  /* register with the interaction-manager */
  useEffect(() => {
    if (!redactionPlugin) return;
    return redactionPlugin.registerMarqueeOnPage({
      pageIndex,
      scale,
      callback: {
        onPreview: setRect,
      },
    });
  }, [redactionPlugin, pageIndex]);

  /* ------------------------------------------------------------------ */
  /* render                                                              */
  /* ------------------------------------------------------------------ */
  if (!rect) return null; // nothing to draw

  return (
    <div
      /* Each page wrapper is position:relative, so absolute is fine */
      style={{
        position: 'absolute',
        pointerEvents: 'none', // ignore hits – underlying page still gets events
        left: rect.origin.x * scale,
        top: rect.origin.y * scale,
        width: rect.size.width * scale,
        height: rect.size.height * scale,
        border: `1px solid ${stroke}`,
        background: fill,
        boxSizing: 'border-box',
      }}
      className={className}
    />
  );
};
