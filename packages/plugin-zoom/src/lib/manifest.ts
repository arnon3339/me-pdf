import { PluginManifest } from '@embedpdf/core';

import { ZoomMode, ZoomPluginConfig } from './types';

export const ZOOM_PLUGIN_ID = 'zoom';

export const manifest: PluginManifest<ZoomPluginConfig> = {
  id: ZOOM_PLUGIN_ID,
  name: 'Zoom Plugin',
  version: '1.0.0',
  provides: ['zoom'],
  requires: ['viewport', 'scroll'],
  optional: ['interaction-manager'],
  defaultConfig: {
    enabled: true,
    defaultZoomLevel: ZoomMode.Automatic,
    minZoom: 0.2,
    maxZoom: 60,
    zoomStep: 0.1,
    zoomRanges: [
      {
        min: 0.2,
        max: 0.5,
        step: 0.05,
      },
      {
        min: 0.5,
        max: 1.0,
        step: 0.1,
      },
      {
        min: 1.0,
        max: 2.0,
        step: 0.2,
      },
      {
        min: 2.0,
        max: 4.0,
        step: 0.4,
      },
      {
        min: 4.0,
        max: 10.0,
        step: 0.8,
      },
    ],
    presets: [
      {
        name: 'Fit Page',
        value: ZoomMode.FitPage,
      },
      {
        name: 'Fit Width',
        value: ZoomMode.FitWidth,
      },
      {
        name: 'Automatic',
        value: ZoomMode.Automatic,
      },
      {
        name: '10%',
        value: 0.1,
      },
      {
        name: '20%',
        value: 0.2,
      },
      {
        name: '30%',
        value: 0.3,
      },
      {
        name: '50%',
        value: 0.5,
      },
      {
        name: '70%',
        value: 0.7,
      },
      {
        name: '100%',
        value: 1,
      },
      {
        name: '200%',
        value: 2,
      },
      {
        name: '400%',
        value: 4,
      },
    ],
  },
};
