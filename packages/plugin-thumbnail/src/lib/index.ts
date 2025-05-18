import { PluginPackage } from "@embedpdf/core";
import { manifest, THUMBNAIL_PLUGIN_ID } from "./manifest";
import { ThumbnailPluginConfig } from "./types";
import { ThumbnailPlugin } from "./thumbnail-plugin";

export const ThumbnailPluginPackage: PluginPackage<
  ThumbnailPlugin,
  ThumbnailPluginConfig
> = {
  manifest,
  create: (registry) => new ThumbnailPlugin(THUMBNAIL_PLUGIN_ID, registry),
  reducer: () => {},
  initialState: {},
};

export * from "./thumbnail-plugin";
export * from "./types";
export * from './manifest';