import { PluginManifest } from "@embedpdf/core";
import { SearchLayerConfig } from "./types";

export const SEARCH_LAYER_ID = 'search-layer';

export const manifest: PluginManifest<SearchLayerConfig> = {
  id: SEARCH_LAYER_ID,
  name: 'Search Layer',
  version: '1.0.0',
  provides: [],
  requires: ['search', 'scroll'],
  optional: [],
  metadata: {
    name: 'Search Layer',
    description: 'Render search layers',
    version: '1.0.0',
    author: 'EmbedPDF',
    license: 'MIT'
  },
  defaultConfig: {
    enabled: true
  }
}; 