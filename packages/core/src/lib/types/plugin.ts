import { EventEmitter } from "../core";
import { IPDFCore } from "./core";

export interface PluginState {
  [key: string]: any;
}

export interface PluginOptions {
  [key: string]: any;
}

export interface IPlugin<TState extends PluginState = PluginState> {
  readonly name: string;
  readonly version: string;
  initialize(core: IPDFCore): Promise<void>;
  destroy(): Promise<void>;
  getState(): TState;
  setState(state: Partial<TState>): void;
  subscribe(callback: (state: TState) => void): () => void;
}

export interface PluginConstructor {
  new (options?: PluginOptions): IPlugin;
}

export interface IPluginManager extends EventEmitter {
  registerPlugin(plugin: IPlugin): Promise<void>;
  unregisterPlugin(pluginName: string): Promise<void>;
  getPlugin<T extends IPlugin>(name: string): T | undefined;
  getPluginState(name: string): PluginState | undefined;
  getAllPlugins(): Map<string, IPlugin>;
  on(event: string, callback: (data: any) => void): () => void;
  emit(event: string, data: any): void;
}