import { CoreState } from "@embedpdf/core";
import { UI_PLUGIN_ID } from "./manifest";
import { UIComponent } from "./ui-component";

export interface UIPluginConfig {
  enabled: boolean;
  components: Record<string, UIComponentType>;
}

export interface UIPluginState {
  flyOut: {
    [id: string]: FlyOutState;
  },
  actionTabs: {
    [id: string]: {};
  },
  panel: {
    [id: string]: PanelState;
  },
  header: {
    [id: string]: HeaderState;
  },
  groupedItems: {
    [id: string]: {};
  },
  divider: {
    [id: string]: {};
  },
  toolButton: {
    [id: string]: {};
  },
  toggleButton: {
    [id: string]: {};
  },
  presetButton: {
    [id: string]: {};
  },
  custom: {
    [id: string]: any;
  }
}

export type NavbarPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface childrenFunctionOptions {
  context?: Record<string, any>;
  filter?: (childId: string) => boolean;
}

export interface UICapability {
  registerComponentRenderer: (type: string, renderer: (props: any, children: (options?: childrenFunctionOptions) => any[], context?: Record<string, any>) => any) => void;
  getComponent: <T extends BaseUIComponent<any, any, any>>(id: string) => UIComponent<T> | undefined;
  getHeadersByPlacement: (placement: 'top' | 'bottom' | 'left' | 'right') => UIComponent<HeaderComponent<any>>[];
  getPanelsByLocation: (location: 'left' | 'right') => UIComponent<PanelComponent<any>>[];
  getFlyOuts: () => UIComponent<FlyOutComponent>[];
  addSlot: (parentId: string, slotId: string, priority?: number) => void;
  registerComponent: (componentId: string, componentProps: UIComponentType) => UIComponent<any>;
  toggleFlyout: (id: string, open?: boolean) => void;
  togglePanel: (id: string, open?: boolean) => void;
  initFlyout: (id: string, triggerElement: HTMLElement) => void;
  setHeaderVisible: (id: string, visible: boolean, visibleChild?: string | null) => void;
}

export interface BaseUIComponent<TProps, TInitial = undefined, TStore = any> {
  id: string;   // e.g., "highlightToolButton",
  type: string; // e.g., "toolButton",
  render?: string;
  /**
   * A function that returns a context object for the component's children.
   */
  getChildContext?: ((props: TProps) => Record<string, any>) | Record<string, any>;

  /**
   * A function that returns a partial set of props from the initial state.
   */
  props?: ((init: TInitial) => TProps) | TProps;

  /**
   * An object containing the initial state for the component, typed as TInitial.
   */
  initialState?: TInitial;

  /**
   * A function that, on store changes, returns new or changed props to update
   * the component with (Redux-like).
   */
  mapStateToProps?: (
    storeState: TStore,
    ownProps: TProps
  ) => TProps;
}

export interface Slot {
  componentId: string;
  priority: number;
}

export interface ActionTab {
  id: string;
  label: string;
  triggerComponent: string | null;
}

export interface ActionTabsProps {
  tabs: ActionTab[];
  targetHeader: string;
}

export interface ActionTabsComponent<TStore = any> extends BaseUIComponent<ActionTabsProps, undefined, TStore> {
  type: 'actionTabs';
}

export interface PanelState {
  open: boolean;
  renderChild: string | null;
}

export interface PanelProps {
  location: 'left' | 'right';
  open: boolean;
  renderChild: string | null;
}

export interface PanelComponent<TStore = any> extends BaseUIComponent<PanelProps, PanelState, TStore> {
  type: 'panel';
  slots: Slot[];
}

export interface FlyOutState {
  open: boolean;
  triggerElement: HTMLElement | null;
}

export interface FlyOutProps {
  open: boolean;
  triggerElement: HTMLElement | null;
  placement?: 'bottom' | 'left' | 'right' | 'top';
}

export interface FlyOutComponent<TStore = any> extends BaseUIComponent<FlyOutProps, FlyOutState, TStore> {
  type: 'flyOut';
  slots: Slot[];
}

export interface HeaderState {
  visible?: boolean;
  renderChild?: string | null;
}

export interface HeaderProps {
  placement: 'top' | 'bottom' | 'left' | 'right';
  style?: Record<string, string>;
  visible?: boolean;
  renderChild?: string | null;
}

export interface HeaderComponent<TStore = any> extends BaseUIComponent<HeaderProps, HeaderState, TStore> {
  type: 'header';
  slots: Slot[]; 
}

export interface GroupedItemsProps {
  justifyContent?: 'start' | 'center' | 'end';
  grow?: number;
  gap?: number;
}

export interface GroupedItemsComponent<TStore = any> extends BaseUIComponent<GroupedItemsProps, undefined, TStore> {
  type: 'groupedItems';
  slots: Slot[];
}

export interface DividerComponent<TStore = any> extends BaseUIComponent<undefined, undefined, TStore> {
  type: 'divider';
}

export interface ToolButtonProps {
  toolName: string;
  label?: string;
  img?: string;
}

export interface ToolButtonComponent<TStore = any> extends BaseUIComponent<ToolButtonProps, undefined, TStore> {
  type: 'toolButton';
}

export interface ToggleButtonProps {
  active?: boolean;
  toggleElement: string;
  label?: string;
  img?: string;
}

export interface ToggleButtonComponent<TStore = any> extends BaseUIComponent<ToggleButtonProps, undefined, TStore> {
  type: 'toggleButton';
}

export interface PresetButtonProps {
  buttonType: string;
  label?: string;
  img?: string;
}

export interface PresetButtonComponent<TStore = any> extends BaseUIComponent<PresetButtonProps, undefined, TStore> {
  type: 'presetButton';
}

export interface CustomComponent<TStore = any> extends BaseUIComponent<any, any, TStore> {
  type: 'custom';
  render: string;
}

// Add this type to extend component props with an ID
export type WithComponentId<TProps> = TProps & {
  id: string;
};

// Add this type for render functions that need component ID in props
export type ComponentRenderFunction<TProps> = (props: WithComponentId<TProps>, children: (options?: childrenFunctionOptions) => any[], context?: Record<string, any>) => any;

export interface GlobalStoreState<TPlugins extends Record<string, any> = {}> {
  core: CoreState;
  plugins: {
    [UI_PLUGIN_ID]: UIPluginState;
  } & TPlugins;
}

export type UIComponentType<TStore = any> = 
  | GroupedItemsComponent<TStore> 
  | DividerComponent<TStore> 
  | ToolButtonComponent<TStore> 
  | ToggleButtonComponent<TStore> 
  | PresetButtonComponent<TStore> 
  | HeaderComponent<TStore> 
  | FlyOutComponent<TStore> 
  | ActionTabsComponent<TStore>
  | PanelComponent<TStore>
  | CustomComponent<TStore>;