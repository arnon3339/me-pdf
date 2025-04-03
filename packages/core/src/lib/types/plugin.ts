import { PluginRegistry } from "../registry/plugin-registry";
import { PdfEngine } from "@embedpdf/models";
import { Action, Reducer } from "../store/types";

export interface IPlugin<TConfig = unknown> {
  id: string;
  
  initialize?(config: TConfig): Promise<void>;
  destroy?(): Promise<void>;
  provides?(): any;
  postInitialize?(): Promise<void>;
}

export interface BasePluginConfig {
  enabled: boolean;
}

export interface PluginManifest<TConfig = unknown> {
  id: string;
  name: string;
  version: string;
  provides: string[];  // Capabilities this plugin provides
  requires: string[]; // Mandatory capabilities
  optional: string[]; // Optional capabilities
  defaultConfig: TConfig;  // Default configuration
  metadata?: {
    description?: string;
    author?: string;
    homepage?: string;
    [key: string]: unknown;
  };
}

export interface PluginPackage<T extends IPlugin<TConfig>, TConfig = unknown, TState = unknown, TAction extends Action = Action> {
  manifest: PluginManifest<TConfig>;
  create(registry: PluginRegistry, engine: PdfEngine, config?: TConfig): T;
  reducer: Reducer<TState, TAction>;
  initialState: TState;
}

export type PluginStatus = 
  | 'registered'   // Plugin is registered but not initialized
  | 'active'       // Plugin is initialized and running
  | 'error'        // Plugin encountered an error
  | 'disabled'     // Plugin is temporarily disabled
  | 'unregistered'; // Plugin is being unregistered

export interface PluginBatchRegistration<T extends IPlugin<TConfig>, TConfig = unknown, TState = unknown, TAction extends Action = Action> {
  package: PluginPackage<T, TConfig, TState, TAction>;
  config?: Partial<TConfig>;
}