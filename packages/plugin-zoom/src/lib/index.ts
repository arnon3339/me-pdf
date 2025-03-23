import { PluginPackage } from "@embedpdf/core";
import { ZoomPlugin } from "./zoom-plugin";
import { manifest, ZOOM_PLUGIN_ID } from "./manifest";
import { ZoomPluginConfig, ZoomState } from "./types";
import { ZoomAction } from "./actions";
import { zoomReducer, initialState } from "./reducer";

export const ZoomPluginPackage: PluginPackage<ZoomPlugin, ZoomPluginConfig, ZoomState, ZoomAction> = {
  manifest,
  create: (registry) => new ZoomPlugin(ZOOM_PLUGIN_ID, registry),
  reducer: zoomReducer,
  initialState,
};

export * from "./zoom-plugin";
export * from "./types";