import { PluginPackage } from "@embedpdf/core";
import { RenderLayerConfig } from "./types";
import { manifest, RENDER_LAYER_ID } from "./manifest";
import { RenderLayer } from "./render-layer";

export const RenderLayerPackage: PluginPackage<RenderLayer, RenderLayerConfig> = {
  manifest,
  create: (registry, engine) => new RenderLayer(RENDER_LAYER_ID, registry, engine),
  reducer: () => {},
  initialState: {}
};

export * from "./render-layer";
export * from "./types";