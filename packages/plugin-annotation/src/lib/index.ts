import { PluginPackage } from "@embedpdf/core";
import { manifest, ANNOTATION_PLUGIN_ID } from "./manifest";
import { AnnotationPluginConfig } from "./types";
import { AnnotationPlugin } from "./annotation-plugin";

export const AnnotationPluginPackage: PluginPackage<
  AnnotationPlugin,
  AnnotationPluginConfig
> = {
  manifest,
  create: (registry, engine) => new AnnotationPlugin(ANNOTATION_PLUGIN_ID, registry, engine),
  reducer: () => {},
  initialState: {},
};

export * from "./annotation-plugin";
export * from "./types";
export * from './manifest';