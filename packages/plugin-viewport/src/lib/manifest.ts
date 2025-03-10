import { PluginManifest } from "@embedpdf/core";
import { ViewportPluginConfig } from "./types";

export const VIEWPORT_PLUGIN_ID = 'viewport';

export const manifest: PluginManifest<ViewportPluginConfig> = {
  id: VIEWPORT_PLUGIN_ID,
  name: 'Viewport Plugin',
  version: '1.0.0',
  provides: ['viewport'],
  consumes: [],
  defaultConfig: {
    enabled: true,
    defaultWidth: 1000,
    defaultHeight: 1000,
    viewportGap: 10
  }
}; 