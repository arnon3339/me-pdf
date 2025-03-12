import { PluginPackage } from "@embedpdf/core";
import { ViewportPlugin } from "./viewport-plugin";
import { manifest, VIEWPORT_PLUGIN_ID } from "./manifest";
import { ViewportPluginConfig } from "./types";

export const ViewportPluginPackage: PluginPackage<ViewportPlugin, ViewportPluginConfig> = {
  manifest,
  create: (registry) => new ViewportPlugin(VIEWPORT_PLUGIN_ID, registry)
};

export * from "./viewport-plugin";
export * from "./types";