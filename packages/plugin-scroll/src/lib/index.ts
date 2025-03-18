import { PluginPackage } from "@embedpdf/core";
import { ScrollPlugin } from "./scroll-plugin";
import { manifest, SCROLL_PLUGIN_ID } from "./manifest";
import { ScrollPluginConfig } from "./types";

export const ScrollPluginPackage: PluginPackage<ScrollPlugin, ScrollPluginConfig> = {
  manifest,
  create: (registry, _engine, config) => new ScrollPlugin(SCROLL_PLUGIN_ID, registry, config)
};

export * from "./scroll-plugin";
export * from "./types"; 