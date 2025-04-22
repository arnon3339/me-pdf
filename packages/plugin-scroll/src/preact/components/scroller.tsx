/** @jsxImportSource preact */
import { JSX } from 'preact';
import { useScroll } from '../hooks';
import { useEffect, useState } from 'preact/hooks';
import { ScrollState, ScrollStrategy } from '@embedpdf/plugin-scroll';

type ScrollerProps = JSX.HTMLAttributes<HTMLDivElement> & {

};

export function Scroller({ ...props }: ScrollerProps) {
  const scroll = useScroll();
  const [state, setState] = useState<ScrollState | null>(
    () => scroll?.getState() ?? null
  );

  useEffect(() => {
    if (!scroll) return;

    return scroll.onStateChange(setState);
  }, [scroll]);

  if (!state) return null;

  return <div {...props} style={{
    width : `${state.totalContentSize.width}px`,
    height: `${state.totalContentSize.height}px`,
    position: 'relative',
    boxSizing: 'border-box',
    margin: '0 auto',
    ...(state.strategy === ScrollStrategy.Horizontal) && {
      display: 'flex',
      flexDirection: 'row', 
    }
  }}>
    <div style={{ 
      ...(state.strategy === ScrollStrategy.Horizontal) ? {
        width: state.startSpacing,
        height: '100%',
        flexShrink: 0,
      } : {
        height: state.startSpacing,
        width: '100%'
      }
    }} />
    <div style={{ 
      gap: state.pageGap, 
      display: 'flex', 
      alignItems: 'center',
      position: 'relative',
      boxSizing: 'border-box',
      ...(state.strategy === ScrollStrategy.Horizontal) ? {
        flexDirection: 'row',
        minHeight: '100%'
      } : {
        flexDirection: 'column',
        minWidth: 'fit-content',
      }
    }}>
      {state.renderedPageIndexes.map(idx => 
        <div key={idx} style={{
          display: 'flex',
          justifyContent: 'center',
        }}>
          {state.virtualItems[idx].pageLayouts.map(layout => 
            <div key={layout.pageNumber} style={{
              width: `${layout.width}px`,
              height: `${layout.height}px`,
              backgroundColor: 'blue',
            }}>
              {layout.pageNumber}
            </div>
          )}
        </div>
      )}
    </div>
    <div style={{ 
      ...(state.strategy === ScrollStrategy.Horizontal) ? {
        width: state.endSpacing,
        height: '100%',
        flexShrink: 0,
      } : {
        height: state.endSpacing,
        width: '100%'
      }
    }} />
  </div>;
}