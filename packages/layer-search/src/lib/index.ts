import { PluginPackage } from "@embedpdf/core";
import { SearchLayerConfig } from "./types";
import { manifest, SEARCH_LAYER_ID } from "./manifest";
import { SearchLayer } from "./search-layer";

export const SearchLayerPackage: PluginPackage<SearchLayer, SearchLayerConfig> = {
  manifest,
  create: (registry, engine) => new SearchLayer(SEARCH_LAYER_ID, registry, engine),
  reducer: () => {},
  initialState: {}
};

export * from "./search-layer";
export * from "./types";