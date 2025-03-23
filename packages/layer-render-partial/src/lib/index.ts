import { PluginPackage } from "@embedpdf/core";
import { RenderPartialLayerConfig } from "./types";
import { manifest, RENDER_PARTIAL_LAYER_ID } from "./manifest";
import { RenderPartialLayer } from "./render-partial-layer";

export const RenderPartialLayerPackage: PluginPackage<RenderPartialLayer, RenderPartialLayerConfig> = {
  manifest,
  create: (registry, engine) => new RenderPartialLayer(RENDER_PARTIAL_LAYER_ID, registry, engine),
  reducer: () => {},
  initialState: {}
};

export * from "./render-partial-layer";
export * from "./types";