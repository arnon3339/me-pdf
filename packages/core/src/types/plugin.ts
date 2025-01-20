import { IPDFCore } from "./core";

export interface PluginState {
  [key: string]: any;
}

export interface PluginOptions {
  [key: string]: any;
}

export interface IPlugin {
  readonly name: string;
  readonly version: string;
  initialize(core: IPDFCore): Promise<void>;
  destroy(): Promise<void>;
  getState(): PluginState;
  setState(state: Partial<PluginState>): void;
}

export interface PluginConstructor {
  new (options?: PluginOptions): IPlugin;
}

export interface IPluginManager {
  registerPlugin(plugin: IPlugin): Promise<void>;
  unregisterPlugin(pluginName: string): Promise<void>;
  getPlugin<T extends IPlugin>(name: string): T | undefined;
  getPluginState(name: string): PluginState | undefined;
  getAllPlugins(): Map<string, IPlugin>;
  on(event: string, callback: (data: any) => void): () => void;
  emit(event: string, data: any): void;
}