import { PluginPackage } from '@embedpdf/core';
import { ViewportPlugin } from './viewport-plugin';
import { manifest, VIEWPORT_PLUGIN_ID } from './manifest';
import { ViewportPluginConfig, ViewportState } from './types';
import { viewportReducer, initialState } from './reducer';
import { ViewportAction } from './actions';

export const ViewportPluginPackage: PluginPackage<
  ViewportPlugin,
  ViewportPluginConfig,
  ViewportState,
  ViewportAction
> = {
  manifest,
  create: (registry, _engine, config) => new ViewportPlugin(VIEWPORT_PLUGIN_ID, registry, config),
  reducer: viewportReducer,
  initialState: initialState,
};

export * from './viewport-plugin';
export * from './types';
export * from './manifest';
