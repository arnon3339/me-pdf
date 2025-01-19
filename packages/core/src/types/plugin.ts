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