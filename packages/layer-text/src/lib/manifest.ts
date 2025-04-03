import { PluginManifest } from "@embedpdf/core";
import { TextLayerConfig } from "./types";

export const TEXT_LAYER_ID = 'text-layer';

export const manifest: PluginManifest<TextLayerConfig> = {
  id: TEXT_LAYER_ID,
  name: 'Text Layer',
  version: '1.0.0',
  provides: [],
  requires: [],
  optional: [],
  metadata: {
    name: 'Text Layer',
    description: 'Render text layers',
    version: '1.0.0',
    author: 'EmbedPDF',
    license: 'MIT'
  },
  defaultConfig: {
    enabled: true
  }
}; 