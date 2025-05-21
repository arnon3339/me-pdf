import { useCapability, usePlugin } from "@embedpdf/core/preact";
import { ViewportPlugin } from "@embedpdf/plugin-viewport";

export const useViewport = () => usePlugin<ViewportPlugin>(ViewportPlugin.id);
export const useViewportCapability = () => useCapability<ViewportPlugin>(ViewportPlugin.id);