import { PluginPackage } from '@embedpdf/core';

import { DownloadPlugin } from './download-plugin';
import { manifest, DOWNLOAD_PLUGIN_ID } from './manifest';
import { DownloadPluginConfig } from './types';

export const DownloadPluginPackage: PluginPackage<DownloadPlugin, DownloadPluginConfig> = {
  manifest,
  create: (registry, engine) => new DownloadPlugin(DOWNLOAD_PLUGIN_ID, registry, engine),
  reducer: () => {},
  initialState: {},
};

export * from './download-plugin';
export * from './types';
export * from './manifest';
