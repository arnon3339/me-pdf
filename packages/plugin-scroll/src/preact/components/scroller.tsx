/** @jsxImportSource preact */
import { ComponentChildren, JSX } from 'preact';
import { useScroll } from '../hooks';
import { useEffect, useState } from 'preact/hooks';
import { ScrollState, ScrollStrategy } from '@embedpdf/plugin-scroll';

type ScrollerProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children: ComponentChildren;
};

export function Scroller({ children, ...props }: ScrollerProps) {
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
    <div style={{ height: state.topPadding }} />
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
    <div style={{ height: state.bottomPadding }} />
  </div>;
}