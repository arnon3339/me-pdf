import { PluginPackage } from "@embedpdf/core";
import { ZoomPlugin } from "./zoom-plugin";
import { manifest, ZOOM_PLUGIN_ID } from "./manifest";
import { ZoomPluginConfig, ZoomState } from "./types";
import { ZoomAction } from "./actions";
import { zoomReducer, initialState } from "./reducer";

export const ZoomPluginPackage: PluginPackage<ZoomPlugin, ZoomPluginConfig, ZoomState, ZoomAction> = {
  manifest,
  create: (registry, _engine, config) => new ZoomPlugin(ZOOM_PLUGIN_ID, registry, config),
  reducer: zoomReducer,
  initialState,
};

export * from "./zoom-plugin";
export * from "./types";
export * from './manifest';