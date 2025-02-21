import { PluginPackage } from "@embedpdf/core";
import { ScrollPlugin } from "./scroll-plugin";
import { manifest, SCROLL_PLUGIN_ID } from "./manifest";
import { ScrollPluginConfig } from "./types";

export const ScrollPluginPackage: PluginPackage<ScrollPlugin, ScrollPluginConfig> = {
  manifest,
  create: (registry) => new ScrollPlugin(SCROLL_PLUGIN_ID, registry)
};

export * from "./scroll-plugin";
