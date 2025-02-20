import { PluginManifest } from "@embedpdf/core";
import { ZoomPluginConfig } from "./zoom-plugin";

export const ZOOM_PLUGIN_ID = 'zoom';

export const manifest: PluginManifest<ZoomPluginConfig> = {
  id: ZOOM_PLUGIN_ID,
  name: 'Zoom Plugin',
  version: '1.0.0',
  provides: [],
  consumes: [],
  defaultConfig: {
    enabled: true,
    defaultZoomLevel: 'automatic'
  }
}; 