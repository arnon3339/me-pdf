/** @jsxImportSource preact */
import { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { ThumbMeta, WindowState } from '@embedpdf/plugin-thumbnail';
import { useThumbnailCapability } from '../hooks';

type ThumbnailsProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'> & {
  style?: JSX.CSSProperties;
  children: (m: ThumbMeta) => ComponentChildren;
};

export function ThumbnailsPane({ style, ...props }: ThumbnailsProps) {
  const { provides: thumbs } = useThumbnailCapability();
  const viewportRef = useRef<HTMLDivElement>(null);

  const [window, setWindow] = useState<WindowState | null>(null);

  /* 1️⃣  subscribe once to window updates */
  useEffect(() => thumbs?.onWindow(setWindow), [thumbs]);

  /* 2️⃣  keep plugin in sync while the user scrolls */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onScroll = () => thumbs?.setViewport(vp.scrollTop, vp.clientHeight);
    vp.addEventListener('scroll', onScroll);
    return () => vp.removeEventListener('scroll', onScroll);
  }, [thumbs]);

  /* 3️⃣  kick-start (or re-kick) after document change */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || !thumbs) return;

    if (window?.items.length === 0) {
      thumbs.setViewport(vp.scrollTop, vp.clientHeight);
    }
  }, [window, thumbs]);

  return (
    <div ref={viewportRef} style={{ overflowY: 'auto', position: 'relative', ...style }} {...props}>
      {/* spacer keeps correct scroll height even before first window arrives */}
      <div style={{ height: window?.totalHeight ?? 0, position: 'relative' }}>
        {window?.items.map((m) => props.children(m))}
      </div>
    </div>
  );
}
