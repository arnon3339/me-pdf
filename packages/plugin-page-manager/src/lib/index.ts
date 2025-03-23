import { PluginPackage } from "@embedpdf/core";
import { manifest, PAGE_MANAGER_PLUGIN_ID } from "./manifest";
import { PageManagerPluginConfig } from "./types";
import { PageManagerPlugin } from "./page-manager-plugin";
import { Rotation } from "@embedpdf/models";

export const PageManagerPluginPackage: PluginPackage<PageManagerPlugin, PageManagerPluginConfig> = {
  manifest,
  create: (registry) => new PageManagerPlugin(PAGE_MANAGER_PLUGIN_ID, registry),
  reducer: () => {},
  initialState: {}
};

export * from "./page-manager-plugin";
export * from "./types";