/** @jsxImportSource preact */
import { h, ComponentType } from 'preact';
import { useRef, useEffect, useContext } from 'preact/hooks';
import { ViewportContext } from '../context';

interface ViewportProps {
  style?: h.JSX.CSSProperties;
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
  } as h.JSX.CSSProperties;

  return <div ref={viewportRef} style={defaultStyle} className={className} />;
} 