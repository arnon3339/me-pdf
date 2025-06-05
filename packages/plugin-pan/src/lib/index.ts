import { PluginPackage } from '@embedpdf/core';

import { PanPlugin } from './pan-plugin';
import { manifest, PAN_PLUGIN_ID } from './manifest';
import { PanPluginConfig } from './types';

export const PanPluginPackage: PluginPackage<PanPlugin, PanPluginConfig> = {
  manifest,
  create: (registry) => new PanPlugin(PAN_PLUGIN_ID, registry),
  reducer: () => {},
  initialState: {},
};

export * from './pan-plugin';
export * from './types';
export * from './manifest';
