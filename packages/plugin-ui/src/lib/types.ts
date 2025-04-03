import { UIComponent } from "./ui-component";

export interface UIPluginConfig {
  enabled: boolean;
  components: Record<string, UIComponentType>;
}

export type NavbarPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface UICapability {
  registerComponentRenderer: (type: string, renderer: (props: any, children: (ctx?: Record<string, any>) => any[], context?: Record<string, any>) => any) => void;
  getComponent: <T extends BaseUIComponent<any, any, any>>(id: string) => UIComponent<T> | undefined;
  getHeadersByPlacement: (placement: 'top' | 'bottom' | 'left' | 'right') => UIComponent<HeaderComponent<any>>[];
  getFlyOuts: () => UIComponent<FlyOutComponent>[];
  addSlot: (parentId: string, slotId: string, priority?: number) => void;
  registerComponent: (componentId: string, componentProps: UIComponentType) => UIComponent<any>;
}

export interface BaseUIComponent<TProps, TInitial = undefined, TStore = any> {
  id: string;   // e.g., "highlightToolButton",
  type: string; // e.g., "toolButton",
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

export interface PanelProps {
  location: 'left' | 'right';
  render: string;
}

export interface PanelComponent<TStore = any> extends BaseUIComponent<PanelProps, undefined, TStore> {
  type: 'panel';
}

export interface FlyOutState {
  open: boolean;
}

export interface FlyOutProps {
  open: boolean;
  triggerElement?: string | null;
  triggerHTMLElement?: HTMLElement | null;
  placement?: 'bottom' | 'left' | 'right' | 'top';
}

export interface FlyOutComponent<TStore = any> extends BaseUIComponent<FlyOutProps, FlyOutState, TStore> {
  type: 'flyOut';
  slots: Slot[];
}

export interface HeaderProps {
  placement: 'top' | 'bottom' | 'left' | 'right';
  style?: Record<string, string>;
  visibleChild?: string | null;
}

export interface HeaderComponent<TStore = any> extends BaseUIComponent<HeaderProps, undefined, TStore> {
  type: 'header';
  slots: Slot[]; 
}

export interface GroupedItemsProps {
  justifyContent?: 'start' | 'center' | 'end';
  grow?: number;
  gap?: number;
  visible?: boolean;
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
}

// Add this type to extend component props with an ID
export type WithComponentId<TProps> = TProps & {
  id: string;
};

// Add this type for render functions that need component ID in props
export type ComponentRenderFunction<TProps> = (props: WithComponentId<TProps>, children: (ctx?: Record<string, any>) => any[], context?: Record<string, any>) => any;

export type UIComponentType<TStore = any> = 
  | GroupedItemsComponent<TStore> 
  | DividerComponent<TStore> 
  | ToolButtonComponent<TStore> 
  | ToggleButtonComponent<TStore> 
  | PresetButtonComponent<TStore> 
  | HeaderComponent<TStore> 
  | FlyOutComponent<TStore> 
  | ActionTabsComponent<TStore>
  | CustomComponent<TStore>;