import { IPlugin } from "./plugin";

export interface PDFEngineOptions {
  defaultPlugins?: IPlugin[];
}

export interface IPDFEngine {
  registerPlugin(plugin: IPlugin): Promise<void>;
  unregisterPlugin(pluginName: string): Promise<void>;
  getPlugin<T extends IPlugin>(name: string): T | undefined;
  getPluginState(name: string): any;
  getAllPlugins(): Map<string, IPlugin>;
  on(event: string, callback: (data: any) => void): () => void;
  emit(event: string, data: any): void;
}