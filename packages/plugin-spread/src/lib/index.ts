import { PluginPackage } from "@embedpdf/core";
import { SpreadPlugin } from "./spread-plugin";
import { manifest, SPREAD_PLUGIN_ID } from "./manifest";
import { SpreadPluginConfig } from "./types";

export const SpreadPluginPackage: PluginPackage<SpreadPlugin, SpreadPluginConfig> = {
  manifest,
  create: (registry) => new SpreadPlugin(SPREAD_PLUGIN_ID, registry)
};

export * from "./spread-plugin";
export * from "./types";