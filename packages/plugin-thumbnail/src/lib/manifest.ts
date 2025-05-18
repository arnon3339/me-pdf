import { PluginManifest } from "@embedpdf/core";
import { ThumbnailPluginConfig } from "./types";

export const THUMBNAIL_PLUGIN_ID = 'thumbnail';

export const manifest: PluginManifest<ThumbnailPluginConfig> = {
  id: THUMBNAIL_PLUGIN_ID,
  name: 'Thumbnail Plugin',
  version: '1.0.0',
  provides: ['thumbnail'],
  requires: ['loader'],
  optional: [],
  defaultConfig: {
    enabled: true
  }
}; 