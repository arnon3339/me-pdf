import { PluginPackage } from "@embedpdf/core";
import { LayerPlugin } from "./layer-plugin";
import { LayerPluginConfig } from "./types";
import { LAYER_PLUGIN_ID, manifest } from "./manifest";

export const LayerPluginPackage: PluginPackage<LayerPlugin, LayerPluginConfig> = {
  manifest,
  create: (registry, engine) => new LayerPlugin(LAYER_PLUGIN_ID, registry, engine)
};

export * from "./base-layer-plugin";
export * from "./layer-plugin";
export * from "./types";