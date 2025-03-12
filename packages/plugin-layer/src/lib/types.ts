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
  topic?: string;
}

/**
 * Controller interface returned from render operations to allow updating layer properties
 * and managing cache
 */
export interface LayerController {
  /**
   * Update layer render options
   */
  update: (options: Partial<LayerRenderOptions>) => Promise<void>;
  
  /**
   * Remove cache for the current render topic/context
   * Individual layers can decide whether to respect this or not
   */
  removeCache: (force?: boolean) => Promise<void>;
}

export interface LayerCapability {
  render: (document: PdfDocumentObject, pageIndex: number, container: HTMLElement, options: LayerRenderOptions) => Promise<LayerController>;
  getLayerById: (id: string) => ILayerPlugin;
  addLayer: (layer: ILayerPlugin) => void;
  removeLayer: (layerId: string) => void;
}

export interface ILayerPlugin<TConfig = unknown> extends IPlugin<TConfig> {
  id: string;
  zIndex: number;
  render: (document: PdfDocumentObject, page: PdfPageObject, container: HTMLElement, options: LayerRenderOptions) => Promise<void>;
  updateRender?: (document: PdfDocumentObject, page: PdfPageObject, container: HTMLElement, options: LayerRenderOptions) => Promise<void>;
  removeCache?: (documentId: string, pageNumber: number, topic?: string, force?: boolean) => Promise<void>;
  destroy?: () => Promise<void>;
} 