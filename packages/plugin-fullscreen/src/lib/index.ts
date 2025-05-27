import { PluginPackage } from '@embedpdf/core';
import { manifest, FULLSCREEN_PLUGIN_ID } from './manifest';
import { FullscreenPluginConfig } from './types';
import { FullscreenPlugin } from './fullscreen-plugin';

export const FullscreenPluginPackage: PluginPackage<FullscreenPlugin, FullscreenPluginConfig> = {
  manifest,
  create: (registry) => new FullscreenPlugin(FULLSCREEN_PLUGIN_ID, registry),
  reducer: () => {},
  initialState: {},
};

export * from './fullscreen-plugin';
export * from './types';
export * from './manifest';
