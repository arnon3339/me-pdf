/** @jsxImportSource preact */
import { setFullscreen } from '@embedpdf/plugin-fullscreen';
import { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import { useFullscreenPlugin, useFullscreenCapability } from '../hooks';

type FullscreenProviderProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'> & {
  children: ComponentChildren;
  style?: JSX.CSSProperties;
};

export function FullscreenProvider({ children, ...props }: FullscreenProviderProps) {
  const { provides: fullscreenCapability } = useFullscreenCapability();
  const { plugin } = useFullscreenPlugin();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fullscreenCapability) return;

    const unsub = fullscreenCapability.onRequest(async (action) => {
      if (action === 'enter') {
        const el = ref.current;
        if (el && !document.fullscreenElement) await el.requestFullscreen();
      } else {
        if (document.fullscreenElement) await document.exitFullscreen();
      }
    });

    return unsub;
  }, [fullscreenCapability]);

  useEffect(() => {
    if (!plugin) return;
    const handler = () => plugin.setFullscreenState(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [plugin]);

  return (
    <div
      {...props}
      style={{ position: 'relative', width: '100%', height: '100%', ...props.style }}
      ref={ref}
    >
      {children}
    </div>
  );
}
