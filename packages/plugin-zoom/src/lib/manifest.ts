import { PluginManifest } from "@embedpdf/core";
import { ZoomPluginConfig } from "./types";

export const ZOOM_PLUGIN_ID = 'zoom';

export const manifest: PluginManifest<ZoomPluginConfig> = {
  id: ZOOM_PLUGIN_ID,
  name: 'Zoom Plugin',
  version: '1.0.0',
  provides: [],
  consumes: [],
  defaultConfig: {
    enabled: true,
    defaultZoomLevel: 'automatic',
    minZoom: 0.25,
    maxZoom: 10,
    zoomStep: 0.1
  }
}; 