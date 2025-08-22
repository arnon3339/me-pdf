import { PluginRegistry } from '../registry/plugin-registry';
import { Logger, PdfEngine, Rotation } from '@embedpdf/models';
import { Action, Reducer } from '../store/types';
import { CoreState } from '../store';

export interface IPlugin<TConfig = unknown> {
  id: string;

  initialize?(config: TConfig): Promise<void>;
  destroy?(): Promise<void> | void;
  provides?(): any;
  postInitialize?(): Promise<void>;
  ready?(): Promise<void>;
}

export interface BasePluginConfig {
  enabled?: boolean;
}

export interface PluginRegistryConfig {
  rotation?: Rotation;
  scale?: number;
  logger?: Logger;
}

export interface PluginManifest<TConfig = unknown> {
  id: string;
  name: string;
  version: string;
  provides: string[]; // Capabilities this plugin provides
  requires: string[]; // Mandatory capabilities
  optional: string[]; // Optional capabilities
  defaultConfig: TConfig; // Default configuration
  metadata?: {
    description?: string;
    author?: string;
    homepage?: string;
    [key: string]: unknown;
  };
}

export interface PluginPackage<
  T extends IPlugin<TConfig>,
  TConfig = unknown,
  TState = unknown,
  TAction extends Action = Action,
> {
  manifest: PluginManifest<TConfig>;
  create(registry: PluginRegistry, config: TConfig): T;
  reducer: Reducer<TState, TAction>;
  initialState: TState | ((coreState: CoreState, config: TConfig) => TState);
}

/**
 * Enhanced plugin package that includes auto-mountable elements.
 * @template T - The base plugin package type
 * @template TElement - The type of elements that can be auto-mounted (React.FC, Preact.FC, Vue component, etc.)
 */
export type WithAutoMount<T extends PluginPackage<any, any, any, any>, TElement = any> = T & {
  /**
   * Returns an array of components/elements that should be automatically
   * mounted in a hidden container when the plugin is initialized.
   * Useful for non-visual DOM utilities like download anchors, print handlers, etc.
   */
  autoMountElements?: () => TElement[];
};

export type PluginStatus =
  | 'registered' // Plugin is registered but not initialized
  | 'active' // Plugin is initialized and running
  | 'error' // Plugin encountered an error
  | 'disabled' // Plugin is temporarily disabled
  | 'unregistered'; // Plugin is being unregistered

export interface PluginBatchRegistration<
  T extends IPlugin<TConfig>,
  TConfig = unknown,
  TState = unknown,
  TAction extends Action = Action,
> {
  package: PluginPackage<T, TConfig, TState, TAction>;
  config?: Partial<TConfig>;
}

export interface GlobalStoreState<TPlugins extends Record<string, any> = {}> {
  core: CoreState;
  plugins: TPlugins;
}
