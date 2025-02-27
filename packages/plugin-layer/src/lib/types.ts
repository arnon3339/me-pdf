import { PdfDocumentObject, PdfPageObject, Rotation } from "@embedpdf/models";
import { IPlugin, PluginPackage } from "@embedpdf/core";

export type LayerEntry<T extends ILayerPlugin<TConfig>, TConfig> = {
  package: PluginPackage<T, TConfig>;
  config?: Partial<TConfig>;
};

export interface LayerPluginConfig {
  enabled: boolean;
  layers: LayerEntry<ILayerPlugin<any>, any>[];
}

export interface LayerRenderOptions {
  scale: number;
  rotation: Rotation;
}

export interface LayerCapability {
  render: (document: PdfDocumentObject, pageIndex: number, container: HTMLElement, options: LayerRenderOptions) => Promise<void>;
  getLayerById: (id: string) => ILayerPlugin;
  addLayer: (layer: ILayerPlugin) => void;
  removeLayer: (layerId: string) => void;
}

export interface ILayerPlugin<TConfig = unknown> extends IPlugin<TConfig> {
  id: string;
  zIndex: number;
  render: (document: PdfDocumentObject, page: PdfPageObject, container: HTMLElement, options: LayerRenderOptions) => Promise<void>;
  destroy?: () => Promise<void>;
} 