import { PluginManifest } from "@embedpdf/core";
import { PageManagerPluginConfig } from "./types";
import { Rotation } from "@embedpdf/models";

export const PAGE_MANAGER_PLUGIN_ID = 'page-manager';

export const manifest: PluginManifest<PageManagerPluginConfig> = {
  id: PAGE_MANAGER_PLUGIN_ID,
  name: 'Page Manager Plugin',
  version: '1.0.0',
  provides: ['page-manager'],
  requires: [],
  optional: ['spread'],
  defaultConfig: {
    enabled: true,
    pageGap: 20,
    scale: 1,
    rotation: Rotation.Degree0
  }
};