/** @jsxImportSource preact */
import { ComponentChildren, JSX } from 'preact';
import { useViewportRef } from '../hooks/use-viewport-ref';
import { useViewport } from '../hooks';
import { useEffect, useState } from 'preact/hooks';

type ViewportProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children: ComponentChildren;
};

export function Viewport({ children, ...props }: ViewportProps) {
  const [viewportGap, setViewportGap] = useState(0);
  const viewportRef = useViewportRef();
  const viewport = useViewport();

  useEffect(() => {
    if (viewport) {
      setViewportGap(viewport.getViewportGap())
    }
  }, [viewport]);

  const { style, ...restProps } = props;
  return <div {...restProps} ref={viewportRef} style={{
    ...(typeof style === 'object' ? style : {}),
    padding: `${viewportGap}px`,
  }}>{children}</div>;
}