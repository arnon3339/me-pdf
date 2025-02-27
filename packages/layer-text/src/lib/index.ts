import { PluginPackage } from "@embedpdf/core";
import { TextLayerConfig } from "./types";
import { manifest, TEXT_LAYER_ID } from "./manifest";
import { TextLayer } from "./text-layer";

export const TextLayerPackage: PluginPackage<TextLayer, TextLayerConfig> = {
  manifest,
  create: (registry, engine) => new TextLayer(TEXT_LAYER_ID, registry, engine)
};

export * from "./text-layer";
export * from "./types";