import { PluginPackage } from "@embedpdf/core";
import { SearchPlugin } from "./search-plugin";
import { manifest, SEARCH_PLUGIN_ID } from "./manifest";
import { SearchPluginConfig } from "./types";

export const SearchPluginPackage: PluginPackage<SearchPlugin, SearchPluginConfig> = {
  manifest,
  create: (registry, engine) => new SearchPlugin(SEARCH_PLUGIN_ID, registry, engine)
};

export * from "./search-plugin";
export * from "./types";