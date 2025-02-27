import { PluginManifest } from "@embedpdf/core";
import { RenderLayerConfig } from "./types";

export const RENDER_LAYER_ID = 'render-layer';

export const manifest: PluginManifest<RenderLayerConfig> = {
  id: RENDER_LAYER_ID,
  name: 'Render Layer',
  version: '1.0.0',
  provides: [],
  consumes: [],
  metadata: {
    name: 'Render Layer',
    description: 'Render canvas layers',
    version: '1.0.0',
    author: 'EmbedPDF',
    license: 'MIT'
  },
  defaultConfig: {
    enabled: true
  }
}; 