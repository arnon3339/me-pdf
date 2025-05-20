import { PluginPackage } from "@embedpdf/core";
import { TilingPluginConfig, TilingState } from "./types";
import { TilingPlugin } from "./tiling-plugin";
import { manifest, TILING_PLUGIN_ID } from "./manifest";
import { initialState } from "./reducer";
import { tilingReducer } from "./reducer";
import { TilingAction } from "./actions";

export const TilingPluginPackage: PluginPackage<
  TilingPlugin, 
  TilingPluginConfig,
  TilingState,
  TilingAction
> = {
  manifest,
  create: (registry, _engine, config) => new TilingPlugin(TILING_PLUGIN_ID, registry, config),
  reducer: (state, action) => tilingReducer(state, action),
  initialState: (coreState, config) => initialState(coreState, config),
};

export * from "./tiling-plugin";
export * from "./types";
export * from "./manifest";