import { IPlugin } from "./plugin";

export interface PDFCoreOptions {
  engine?: any; // We'll type this properly later
  defaultPlugins?: IPlugin[];
}

export interface IPDFCore {
  registerPlugin(plugin: IPlugin): Promise<void>;
  unregisterPlugin(pluginName: string): Promise<void>;
  getPlugin<T extends IPlugin>(name: string): T | undefined;
  getPluginState(name: string): any;
  getAllPlugins(): Map<string, IPlugin>;
  loadDocument(source: ArrayBuffer | string): Promise<void>;
  on(event: string, callback: (data: any) => void): () => void;
  emit(event: string, data: any): void;
}