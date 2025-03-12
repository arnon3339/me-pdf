import { PluginPackage } from "@embedpdf/core";
import { ZoomPlugin } from "./zoom-plugin";
import { manifest, ZOOM_PLUGIN_ID } from "./manifest";
import { ZoomPluginConfig } from "./types";

export const ZoomPluginPackage: PluginPackage<ZoomPlugin, ZoomPluginConfig> = {
  manifest,
  create: (registry) => new ZoomPlugin(ZOOM_PLUGIN_ID, registry)
};

export * from "./zoom-plugin";
export * from "./types";