/** @jsxImportSource preact */
import { h, JSX, ComponentChildren } from 'preact';
import { useUI } from '../hooks';
import { ComponentWrapper } from './component-wrapper';
import { UIComponent } from '@embedpdf/plugin-ui';

/**
 * Interface for UI components organized by type/location
 */
export interface UIComponentsMap {
  headers: {
    top: JSX.Element[];
    bottom: JSX.Element[];
    left: JSX.Element[];
    right: JSX.Element[];
  };
  panels: {
    left: JSX.Element[];
    right: JSX.Element[];
  };
  floating: JSX.Element[];
  commandMenu: JSX.Element | null;
}

/**
 * Props for the PluginUIProvider
 */
export interface PluginUIProviderProps {
  /**
   * Render function that receives UI components
   */
  children: (components: UIComponentsMap) => JSX.Element;
}

/**
 * PluginUIProvider collects all components from the UI plugin system
 * and provides them to a render function without imposing any structure.
 * 
 * It uses the render props pattern for maximum flexibility.
 */
export function PluginUIProvider({ children }: PluginUIProviderProps) {
  const ui = useUI();

  // Helper function to wrap UIComponents as JSX elements
  const wrapComponents = (components: UIComponent<any>[]): JSX.Element[] => {
    return components.map(component => (
      <ComponentWrapper key={component.props.id} component={component} />
    ));
  };

  // Collect and wrap all components from UI plugin
  const componentMap: UIComponentsMap = {
    headers: {
      top: wrapComponents(ui?.getHeadersByPlacement('top') || []),
      bottom: wrapComponents(ui?.getHeadersByPlacement('bottom') || []),
      left: wrapComponents(ui?.getHeadersByPlacement('left') || []),
      right: wrapComponents(ui?.getHeadersByPlacement('right') || [])
    },
    panels: {
      left: wrapComponents(ui?.getPanelsByLocation('left') || []),
      right: wrapComponents(ui?.getPanelsByLocation('right') || [])
    },
    floating: wrapComponents(ui?.getFloatingComponents() || []),
    commandMenu: ui?.getCommandMenu() 
      ? <ComponentWrapper component={ui.getCommandMenu()!} />
      : null
  };

  // Let the consumer determine the layout structure through the render prop
  return children(componentMap);
}