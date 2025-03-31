import { UIComponent } from "./ui-component";

export interface UIPluginConfig {
  enabled: boolean;
  components: Record<string, UIComponentCollection>;
}

export type NavbarPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface UICapability {
  registerComponentRenderer: (type: string, renderer: (props: any, children: any[], context?: any) => any) => void;
  getComponent: <T>(id: string) => UIComponent<T> | undefined;
  getHeadersByPlacement: (placement: 'top' | 'bottom' | 'left' | 'right') => UIComponent<HeaderComponent>[];
  getFlyOuts: () => UIComponent<FlyOutComponent>[];
}

export interface BaseUIComponent {
  dataElement: string;   // e.g., "highlightToolButton",
  getChildContext?: any;
}

export interface FlyOutComponent extends BaseUIComponent {
  type: 'flyOut';
  open: boolean;
  triggerElement: string | null;
  triggerHTMLElement: HTMLElement | null;
  items: string[];
}

export interface HeaderComponent extends BaseUIComponent {
  type: 'header';
  placement: 'top' | 'bottom' | 'left' | 'right';
  items: string[];                  // e.g., ["group1", "button1"]
  style?: Record<string, string>;   // Optional CSS styles
}

export interface GroupedItemsComponent extends BaseUIComponent {
  type: 'groupedItems';
  items: string[];                       // e.g., ["toolButton1", "toggleButton1"]
  justifyContent?: 'start' | 'center' | 'end';
  grow?: number;                         // Flex grow factor
  gap?: number;                          // Spacing between items in pixels
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

export type UIComponentCollection = GroupedItemsComponent | DividerComponent | ToolButtonComponent | ToggleButtonComponent | PresetButtonComponent | HeaderComponent | FlyOutComponent;