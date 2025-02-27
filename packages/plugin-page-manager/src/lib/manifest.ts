import { PluginManifest } from "@embedpdf/core";
import { PageManagerPluginConfig } from "./types";

export const PAGE_MANAGER_PLUGIN_ID = 'page-manager';

export const manifest: PluginManifest<PageManagerPluginConfig> = {
  id: PAGE_MANAGER_PLUGIN_ID,
  name: 'Page Manager Plugin',
  version: '1.0.0',
  provides: ['page-manager'],
  consumes: ['loader', 'spread', 'layer'],
  defaultConfig: {
    enabled: true,
    pageGap: 20
  }
};