/** @jsxImportSource preact */
import { ComponentChildren, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { useViewportCapability } from '../hooks';
import { useViewportRef } from '../hooks/use-viewport-ref';

type ViewportProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children: ComponentChildren;
};

export function Viewport({ children, ...props }: ViewportProps) {
  const [viewportGap, setViewportGap] = useState(0);
  const viewportRef = useViewportRef();
  const { provides: viewportProvides } = useViewportCapability();

  useEffect(() => {
    if (viewportProvides) {
      setViewportGap(viewportProvides.getViewportGap());
    }
  }, [viewportProvides]);

  const { style, ...restProps } = props;
  return (
    <div
      {...restProps}
      ref={viewportRef}
      style={{
        ...(typeof style === 'object' ? style : {}),
        padding: `${viewportGap}px`,
      }}
    >
      {children}
    </div>
  );
}
