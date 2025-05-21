import { PluginPackage } from "@embedpdf/core";
import { manifest, PRINT_PLUGIN_ID } from "./manifest";
import { PrintPluginConfig } from "./types";
import { PrintPlugin } from "./print-plugin";

export const PrintPluginPackage: PluginPackage<
  PrintPlugin,
  PrintPluginConfig
> = {
  manifest,
  create: (registry) => new PrintPlugin(PRINT_PLUGIN_ID, registry),
  reducer: () => {},
  initialState: {},
};

export * from "./print-plugin";
export * from "./types";
export * from './manifest';