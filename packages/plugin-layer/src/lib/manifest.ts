import { PluginManifest } from "@embedpdf/core";
import { LayerPluginConfig } from "./types";

export const LAYER_PLUGIN_ID = 'layer';

export const manifest: PluginManifest<LayerPluginConfig> = {
  id: LAYER_PLUGIN_ID,
  name: 'Layer Plugin',
  version: '1.0.0',
  provides: ['layer'],
  consumes: [],
  metadata: {
    name: 'Layer Plugin',
    description: 'A plugin for rendering layers',
    version: '1.0.0',
    author: 'EmbedPDF',
    license: 'MIT'
  },
  defaultConfig: {
    enabled: true,
    layers: []
  }
}; 