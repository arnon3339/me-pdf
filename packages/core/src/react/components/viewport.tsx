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

  // Combine default style with user-provided styles
  const defaultStyle = {
    '--scale-factor': '1',
    ...style
  } as React.CSSProperties;

  return <div ref={viewportRef} style={defaultStyle} className={className} />;
}