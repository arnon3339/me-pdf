import { PluginPackage } from '@embedpdf/core';
import { RedactionPluginConfig } from './types';
import { RedactionPlugin } from './redaction-plugin';
import { manifest, REDACTION_PLUGIN_ID } from './manifest';

export const RedactionPluginPackage: PluginPackage<RedactionPlugin, RedactionPluginConfig> = {
  manifest,
  create: (registry, engine) => new RedactionPlugin(REDACTION_PLUGIN_ID, registry, engine),
  reducer: () => {},
  initialState: {},
};

export * from './redaction-plugin';
export * from './types';
export * from './manifest';
