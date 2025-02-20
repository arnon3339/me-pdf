import { PluginPackage } from "@embedpdf/core";
import { ScrollPlugin, ScrollPluginConfig } from "./scroll-plugin";
import { manifest, SCROLL_PLUGIN_ID } from "./manifest";

export const ScrollPluginPackage: PluginPackage<ScrollPlugin, ScrollPluginConfig> = {
  manifest,
  create: (registry) => new ScrollPlugin(SCROLL_PLUGIN_ID, registry)
};

export * from "./scroll-plugin";
