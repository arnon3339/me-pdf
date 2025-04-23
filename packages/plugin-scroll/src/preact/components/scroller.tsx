/** @jsxImportSource preact */
import { JSX } from 'preact';
import { useScroll } from '../hooks';
import { useEffect, useState } from 'preact/hooks';
import { ScrollStrategy, ScrollerLayout } from '@embedpdf/plugin-scroll';

type ScrollerProps = JSX.HTMLAttributes<HTMLDivElement> & {

};

export function Scroller({ ...props }: ScrollerProps) {
  const scroll = useScroll();
  const [scrollerLayout, setScrollerLayout] = useState<ScrollerLayout | null>(
    () => scroll?.getScrollerLayout() ?? null
  );

  useEffect(() => {
    if (!scroll) return;

    return scroll.onScrollerData(setScrollerLayout);
  }, [scroll]);

  if (!scrollerLayout) return null;

  return <div {...props} style={{
    width : `${scrollerLayout.totalWidth}px`,
    height: `${scrollerLayout.totalHeight}px`,
    position: 'relative',
    boxSizing: 'border-box',
    margin: '0 auto',
    ...(scrollerLayout.strategy === ScrollStrategy.Horizontal) && {
      display: 'flex',
      flexDirection: 'row',
    }
  }}>
    <div style={{ 
      ...(scrollerLayout.strategy === ScrollStrategy.Horizontal) ? {
        width: scrollerLayout.startSpacing,
        height: '100%',
        flexShrink: 0,
      } : {
        height: scrollerLayout.startSpacing,
        width: '100%'
      }
    }} />
    <div style={{ 
      gap: scrollerLayout.pageGap, 
      display: 'flex', 
      alignItems: 'center',
      position: 'relative',
      boxSizing: 'border-box',
      ...(scrollerLayout.strategy === ScrollStrategy.Horizontal) ? {
        flexDirection: 'row',
        minHeight: '100%'
      } : {
        flexDirection: 'column',
        minWidth: 'fit-content',
      }
    }}>
      {scrollerLayout.items.map(item => 
        <div key={item.pageNumbers[0]} style={{
          display: 'flex',
          justifyContent: 'center',
        }}>
          {item.pageLayouts.map(layout => 
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
      ...(scrollerLayout.strategy === ScrollStrategy.Horizontal) ? {
        width: scrollerLayout.endSpacing,
        height: '100%',
        flexShrink: 0,
      } : {
        height: scrollerLayout.endSpacing,
        width: '100%'
      }
    }} />
  </div>;
}