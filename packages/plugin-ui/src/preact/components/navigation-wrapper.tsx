/** @jsxImportSource preact */
import { h, Fragment, ComponentChildren } from 'preact';
import { useUI } from '../hooks';

export function NavigationWrapper({ children }: { children: ComponentChildren }) {
  const ui = useUI();

  const navbars = ui ? ui.renderNavbars() : {top: [], left: [], right: [], bottom: []};
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {navbars.top && (
        <div style={{ width: '100%' }}>
          {navbars.top.map(top => top)}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'row', flexGrow: 1, overflow: 'hidden' }}>
        {navbars.left && (
          <div>{navbars.left.map(left => left)}</div>
        )}
        <div style={{ flexGrow: 1, position: 'relative' }}>
          {children}
        </div>
        {navbars.right && (
          <div>
            {navbars.right.map(right => right)}
          </div>
        )}
      </div>
      {navbars.bottom && (
        <div style={{ width: '100%' }}>
          {navbars.bottom.map(bottom => bottom)}
        </div>
      )}
    </div>
  );
}