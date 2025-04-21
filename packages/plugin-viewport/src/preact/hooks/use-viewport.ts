import { useCapability } from "@embedpdf/core/preact";
import { ViewportPlugin } from "@embedpdf/plugin-viewport";

export const useViewport = () => useCapability<ViewportPlugin>('viewport');