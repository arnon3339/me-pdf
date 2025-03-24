import { PluginManifest } from "@embedpdf/core";
import { RenderPartialLayerConfig } from "./types";

export const RENDER_PARTIAL_LAYER_ID = 'render-partial-layer';

export const manifest: PluginManifest<RenderPartialLayerConfig> = {
  id: RENDER_PARTIAL_LAYER_ID,
  name: 'Render Partial Layer',
  version: '1.0.0',
  provides: [],
  requires: ['scroll'],
  optional: [],
  metadata: {
    name: 'Render Partial Layer',
    description: 'Render canvas layers',
    version: '1.0.0',
    author: 'EmbedPDF',
    license: 'MIT'
  },
  defaultConfig: {
    enabled: true
  }
}; 