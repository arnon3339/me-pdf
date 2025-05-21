import { PluginRegistry } from "@embedpdf/core";

export type Dynamic<TStore, T> = T | ((state: TStore) => T);

export interface MenuItemBase<TStore = any> {
  icon?: string;
  label: Dynamic<TStore, string>;
  active?: Dynamic<TStore, boolean>;                  // whether command is currently active
  disabled?: Dynamic<TStore, boolean>;                // whether command is currently disabled
  shortcut?: string;                                    // "Ctrl+Plus"
  shortcutLabel?: string;                               // "Ctrl+Plus"
  visible?: Dynamic<TStore, boolean>;                                    // whether command should be visible
  dividerBefore?: boolean;                              // whether to add a divider before the command
}

export interface Action<TStore = any> extends MenuItemBase<TStore> {
  id: string;                                           // "zoomIn"
  type: 'action';                                      // i18n key or literal
  action: (registry: PluginRegistry, state: TStore) => void;           // executed onClick                             // whether to add a divider before the command
}

export interface Group<TStore = any> {
  id: string;
  type: 'group';
  label: Dynamic<TStore, string>;
  children: string[];
}

export interface Menu<TStore = any> extends MenuItemBase<TStore> {
  id: string;
  type: 'menu';
  children: string[];                                  
}

export type MenuItem<TStore = any> = 
  | Action<TStore>   
  | Group 
  | Menu<TStore>;

export type MenuRegistry = Record<string, MenuItem>;

// Options for executing an action
export interface ExecuteOptions {
  source?: 'click' | 'shortcut' | 'api';
  triggerElement?: HTMLElement;
  flatten?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

// Result of menu item resolution
export interface ResolvedMenuItem<TStore = any> {
  item: MenuItem<TStore>;
  isGroup: boolean;
  isMenu: boolean;
  isAction: boolean;
}

export function hasActive<TStore>(command: MenuItem<TStore>): command is Action<TStore> {
  return 'active' in command;
}

export interface MenuManagerCapabilities {
  registerItem: (commandItem: MenuItem) => void;
  registerItems: (commands: MenuRegistry) => void;
  executeCommand: (id: string, options?: ExecuteOptions) => void;
  getAction: (id: string) => Action | undefined;
  getMenuOrAction: (id: string) => Menu | Action | undefined;
  getChildItems: (commandId: string, options?: { flatten?: boolean }) => MenuItem[];
  getItemsByIds: (ids: string[]) => MenuItem[];
  getAllItems: () => MenuRegistry;
}