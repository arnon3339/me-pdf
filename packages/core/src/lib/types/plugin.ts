import { PluginRegistry } from "../registry/plugin-registry";
import { PdfEngine } from "@embedpdf/models";

export interface IPlugin<TConfig = unknown> {
  id: string;
  
  initialize?(config: TConfig): Promise<void>;
  destroy?(): Promise<void>;
  provides?(): any;
}

export interface BasePluginConfig {
  enabled: boolean;
}

export interface PluginManifest<TConfig = unknown> {
  id: string;
  name: string;
  version: string;
  provides: string[];  // Capabilities this plugin provides
  consumes: string[]; // Capabilities this plugin requires
  defaultConfig: TConfig;  // Default configuration
  metadata?: {
    description?: string;
    author?: string;
    homepage?: string;
    [key: string]: unknown;
  };
}

export interface PluginPackage<T extends IPlugin<TConfig>, TConfig = unknown> {
  manifest: PluginManifest<TConfig>;
  create(registry: PluginRegistry, engine: PdfEngine, config?: TConfig): T;
}

export type PluginStatus = 
  | 'registered'   // Plugin is registered but not initialized
  | 'active'       // Plugin is initialized and running
  | 'error'        // Plugin encountered an error
  | 'disabled'     // Plugin is temporarily disabled
  | 'unregistered'; // Plugin is being unregistered

export interface PluginBatchRegistration<T extends IPlugin<TConfig>, TConfig = unknown> {
  package: PluginPackage<T, TConfig>;
  config?: Partial<TConfig>;
}