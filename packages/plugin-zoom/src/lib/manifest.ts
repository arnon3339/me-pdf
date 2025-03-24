import { PluginManifest } from "@embedpdf/core";
import { ZoomMode, ZoomPluginConfig } from "./types";

export const ZOOM_PLUGIN_ID = 'zoom';

export const manifest: PluginManifest<ZoomPluginConfig> = {
  id: ZOOM_PLUGIN_ID,
  name: 'Zoom Plugin',
  version: '1.0.0',
  provides: ['zoom'],
  requires: ['viewport', 'page-manager'],
  optional: [],
  defaultConfig: {
    enabled: true,
    defaultZoomLevel: ZoomMode.Automatic,
    minZoom: 0.25,
    maxZoom: 10,
    zoomStep: 0.1
  }
}; 