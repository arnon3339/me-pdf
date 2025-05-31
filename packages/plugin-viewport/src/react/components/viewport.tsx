import React, { ReactNode, useEffect, useState } from 'react';

import { useViewportCapability } from '../hooks';
import { useViewportRef } from '../hooks/use-viewport-ref';

type ViewportProps = React.HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
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
