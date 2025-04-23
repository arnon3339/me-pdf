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
    minZoom: 0.20,
    maxZoom: 10,
    zoomStep: 0.1,
    zoomRanges: [
      {
        min: 0.20,
        max: 0.50,
        step: 0.05
      },
      {
        min: 0.50,
        max: 1.00,
        step: 0.10
      },
      {
        min: 1.00,
        max: 2.00,
        step: 0.20
      },
      {
        min: 2.00,
        max: 4.00,
        step: 0.40
      },
      {
        min: 4.00,
        max: 10.00,
        step: 0.80
      }
    ],
    presets: [
      {
        name: 'Fit Page',
        value: ZoomMode.FitPage
      },
      {
        name: 'Fit Width',
        value: ZoomMode.FitWidth
      },
      {
        name: 'Automatic',
        value: ZoomMode.Automatic
      },
      {
        name: '10%',
        value: 0.1
      },
      {
        name: '20%',
        value: 0.2
      },
      {
        name: '30%',
        value: 0.3
      },
      {
        name: '50%',
        value: 0.5
      },
      {
        name: '70%',
        value: 0.7
      },
      {
        name: '100%',
        value: 1
      },
      {
        name: '200%',
        value: 2
      },
      {
        name: '400%',
        value: 4
      },
      
    ]
  }
}; 
