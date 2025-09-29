import { useEffect, useRef, useState, HTMLAttributes, CSSProperties, ReactNode } from '@framework';
import { ThumbMeta, WindowState } from '@embedpdf/plugin-thumbnail';
import { useThumbnailPlugin } from '../hooks';

type ThumbnailsProps = Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'children'> & {
  style?: CSSProperties;
  children: (m: ThumbMeta) => ReactNode;
  /** @deprecated use scrollToThumb instead */
  selectedPage?: number;
  scrollOptions?: ScrollIntoViewOptions;
};

export function ThumbnailsPane({
  style,
  selectedPage,
  scrollOptions = { behavior: 'smooth', block: 'nearest', inline: 'nearest' },
  ...props
}: ThumbnailsProps) {
  const { plugin: thumbnailPlugin } = useThumbnailPlugin();
  const viewportRef = useRef<HTMLDivElement>(null);

  const [window, setWindow] = useState<WindowState | null>(null);

  // 1) subscribe once to window updates
  useEffect(() => thumbnailPlugin?.onWindow(setWindow), [thumbnailPlugin]);

  // 2) keep plugin in sync while the user scrolls
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onScroll = () => thumbnailPlugin?.updateWindow(vp.scrollTop, vp.clientHeight);
    vp.addEventListener('scroll', onScroll);
    return () => vp.removeEventListener('scroll', onScroll);
  }, [thumbnailPlugin]);

  // 3) kick-start after document change
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || !thumbnailPlugin) return;

    // push initial metrics
    thumbnailPlugin.updateWindow(vp.scrollTop, vp.clientHeight);
  }, [window, thumbnailPlugin]);

  // 4) NEW: let plugin drive scroll – minimal pane logic
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || !thumbnailPlugin) return;

    return thumbnailPlugin.onScrollTo((top) => {
      vp.scrollTo({ top, ...scrollOptions });
    });
  }, [thumbnailPlugin, scrollOptions]);

  return (
    <div ref={viewportRef} style={{ overflowY: 'auto', position: 'relative', ...style }} {...props}>
      <div style={{ height: window?.totalHeight ?? 0, position: 'relative' }}>
        {window?.items.map((m) => props.children(m))}
      </div>
    </div>
  );
}
