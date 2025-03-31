import { PluginPackage } from "@embedpdf/core";
import { UIPlugin } from "./ui-plugin";
import { manifest, UI_PLUGIN_ID } from "./manifest";
import { UIPluginConfig } from "./types";

export const UIPluginPackage: PluginPackage<UIPlugin, UIPluginConfig> = {
  manifest,
  create: (registry, _engine, config) => new UIPlugin(UI_PLUGIN_ID, registry, config!),
  reducer: () => {},
  initialState: {}
};

export * from "./ui-plugin";
export * from "./types";
export * from "./ui-component";