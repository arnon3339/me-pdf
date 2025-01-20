import { PdfDocumentObject, PdfEngine } from '@cloudpdf/models';
import { IPlugin } from "./plugin";
import { PDFLoadingOptions } from '../core/loader/strategies/PDFLoadingStrategy';

export interface PDFCoreOptions {
  engine: PdfEngine;
  defaultPlugins?: IPlugin[];
}

export type PDFCoreLoadDocumentOptions = Omit<PDFLoadingOptions, 'engine'>;

export interface IPDFCore {
  registerPlugin(plugin: IPlugin): Promise<void>;
  unregisterPlugin(pluginName: string): Promise<void>;
  getPlugin<T extends IPlugin>(name: string): T | undefined;
  getPluginState(name: string): any;
  getAllPlugins(): Map<string, IPlugin>;
  loadDocument(options: PDFCoreLoadDocumentOptions): Promise<PdfDocumentObject>;
  on(event: string, callback: (data: any) => void): () => void;
  emit(event: string, data: any): void;
}