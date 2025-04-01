/** @jsxImportSource preact */
import { h, Fragment, ComponentChildren } from 'preact';
import { useUI } from '../hooks';
import { ComponentWrapper } from './component-wrapper';

export function NavigationWrapper({ children }: { children: ComponentChildren }) {
  const ui = useUI();

  const navbars = ui ? {top: ui.getHeadersByPlacement('top'), left: ui.getHeadersByPlacement('left'), right: ui.getHeadersByPlacement('right'), bottom: ui.getHeadersByPlacement('bottom')} : {top: [], left: [], right: [], bottom: []};
  const flyouts = ui ? ui.getFlyOuts() : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {navbars.top && (
        <div style={{ width: '100%' }}>
          {navbars.top.map(header => <ComponentWrapper key={header.props.id} component={header} />)}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'row', flexGrow: 1, overflow: 'hidden' }}>
        {navbars.left && (
            <div>{navbars.left.map(header => <ComponentWrapper key={header.props.id} component={header} />)}</div>
        )}
        <div style={{ flexGrow: 1, position: 'relative' }}>
          {children}
        </div>
        {navbars.right && (
          <div>
            {navbars.right.map(header => <ComponentWrapper key={header.props.id} component={header} />)}
          </div>
        )}
      </div>
      {navbars.bottom && (
        <div style={{ width: '100%' }}>
          {navbars.bottom.map(header => <ComponentWrapper key={header.props.id} component={header} />)}
        </div>
      )}
      {flyouts.map(flyout => <ComponentWrapper key={flyout.props.id} component={flyout} />)}
    </div>
  );
}