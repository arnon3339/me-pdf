import React, { useRef, useEffect, useContext } from 'react';
import { ViewportContext } from '../context';

interface ViewportProps {
  style?: React.CSSProperties;
  className?: string;
}

export function Viewport({ style, className }: ViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewportContext = useContext(ViewportContext);

  useEffect(() => {
    if (viewportRef.current && viewportContext) {
      viewportContext.setViewportRef(viewportRef.current);
    }
  }, [viewportContext]);

  return <div ref={viewportRef} style={style} className={className} />;
}