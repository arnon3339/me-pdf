import { useCapability, usePlugin } from "@embedpdf/core/preact";
import { TilingPlugin } from "@embedpdf/plugin-tiling";

export const useTiling = () => usePlugin<TilingPlugin>(TilingPlugin.id);
export const useTilingCapability = () => useCapability<TilingPlugin>(TilingPlugin.id);