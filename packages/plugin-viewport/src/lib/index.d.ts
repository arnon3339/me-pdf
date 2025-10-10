import { PluginPackage } from '@embedpdf/core';
import { ViewportAction } from './actions';
import { ViewportPluginConfig, ViewportState } from './types';
import { ViewportPlugin } from './viewport-plugin';
export declare const ViewportPluginPackage: PluginPackage<ViewportPlugin, ViewportPluginConfig, ViewportState, ViewportAction>;
export * from './viewport-plugin';
export * from './types';
export * from './manifest';
