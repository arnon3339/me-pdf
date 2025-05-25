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

  /* subscribe once */
  useEffect(() => thumbs?.onWindow(setWindow), []);

  /* update window on scroll */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onScroll = () => thumbs?.setViewport(vp.scrollTop, vp.clientHeight);
    onScroll(); // first call
    vp.addEventListener('scroll', onScroll);
    return () => vp.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={viewportRef} style={{ overflowY: 'auto', position: 'relative', ...style }} {...props}>
      {/* spacer keeps correct scroll height even before first window arrives */}
      <div style={{ height: window?.totalHeight ?? 0, position: 'relative' }}>
        {window?.items.map((m) => props.children(m))}
      </div>
    </div>
  );
}
