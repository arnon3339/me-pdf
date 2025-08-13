import { PluginPackage } from '@embedpdf/core';

import { ExportPlugin } from './export-plugin';
import { manifest, EXPORT_PLUGIN_ID } from './manifest';
import { ExportPluginConfig } from './types';

export const ExportPluginPackage: PluginPackage<ExportPlugin, ExportPluginConfig> = {
  manifest,
  create: (registry) => new ExportPlugin(EXPORT_PLUGIN_ID, registry),
  reducer: () => {},
  initialState: {},
};

export * from './export-plugin';
export * from './types';
export * from './manifest';
