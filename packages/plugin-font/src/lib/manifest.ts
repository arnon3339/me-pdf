import { PluginManifest } from '@embedpdf/core';
import { FontPluginConfig } from './types';

export const FONT_PLUGIN_ID = 'font';

export const manifest: PluginManifest<FontPluginConfig> = {
    id: FONT_PLUGIN_ID,
    name: 'Font Plugin',
    version: '1.0.0',
    provides: ['font'],
    requires: [],
    optional: [],
    defaultConfig: {},
};
