import { PluginManifest } from '@embedpdf/core';
import { DownloadPluginConfig } from './types';

export const DOWNLOAD_PLUGIN_ID = 'download';

export const manifest: PluginManifest<DownloadPluginConfig> = {
  id: DOWNLOAD_PLUGIN_ID,
  name: 'Download Plugin',
  version: '1.0.0',
  provides: ['download'],
  requires: [],
  optional: [],
  defaultConfig: {
    enabled: true,
  },
};
