import { UIComponent } from "./ui-component";

export interface UIPluginConfig {
  enabled: boolean;
  components: Record<string, UIComponentCollection>;
}

export type NavbarPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface UICapability {
  registerComponentRenderer: (type: string, renderer: (props: any, children: (ctx?: Record<string, any>) => any[], context?: Record<string, any>) => any) => void;
  getComponent: <T>(id: string) => UIComponent<T> | undefined;
  getHeadersByPlacement: (placement: 'top' | 'bottom' | 'left' | 'right') => UIComponent<HeaderComponent>[];
  getFlyOuts: () => UIComponent<FlyOutComponent>[];
  addSlot: (parentId: string, slotId: string, priority?: number) => void;
  registerComponent: (componentId: string, componentProps: UIComponentCollection) => UIComponent<any>;
}

export interface BaseUIComponent {
  id: string;   // e.g., "highlightToolButton",
  getChildContext?: any;
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

export interface ActionTabsComponent extends BaseUIComponent {
  type: 'actionTabs';
  tabs: ActionTab[];
  targetHeader: string;
}

export interface FlyOutComponent extends BaseUIComponent {
  type: 'flyOut';
  open: boolean;
  triggerElement?: string | null;
  triggerHTMLElement?: HTMLElement | null;
  placement?: 'bottom' | 'left' | 'right' | 'top';
  slots: Slot[];
}

export interface HeaderComponent extends BaseUIComponent {
  type: 'header';
  placement: 'top' | 'bottom' | 'left' | 'right';
  slots: Slot[];                    // e.g., ["group1", "button1"]
  style?: Record<string, string>;   // Optional CSS styles
  visibleChild?: string | null;
}

export interface GroupedItemsComponent extends BaseUIComponent {
  type: 'groupedItems';
  slots: Slot[];                     // e.g., ["toolButton1", "toggleButton1"]
  justifyContent?: 'start' | 'center' | 'end';
  grow?: number;                         // Flex grow factor
  gap?: number;                          // Spacing between items in pixels
  visible?: boolean;
}

export interface DividerComponent extends BaseUIComponent {
  type: 'divider';
}

export interface ToolButtonComponent extends BaseUIComponent {
  type: 'toolButton';
  toolName: string;    // e.g., "AnnotationCreateTextHighlight"
  label?: string;      // e.g., "Highlight"
  img?: string;        // e.g., "icon-highlight"
}

export interface ToggleButtonComponent extends BaseUIComponent {
  type: 'toggleButton';
  active?: boolean;
  toggleElement: string;    // e.g., "searchPanel"
  label?: string;           // e.g., "Search"
  img?: string;             // e.g., "icon-search"
}

export interface PresetButtonComponent extends BaseUIComponent {
  type: 'presetButton';
  buttonType: string;    // e.g., "undoButton"
  label?: string;        // e.g., "Undo"
  img?: string;          // e.g., "icon-undo"
}

export type UIComponentCollection = GroupedItemsComponent | DividerComponent | ToolButtonComponent | ToggleButtonComponent | PresetButtonComponent | HeaderComponent | FlyOutComponent | ActionTabsComponent;