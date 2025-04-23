import { useCapability } from "@embedpdf/core/preact";
import { ZoomPlugin } from "@embedpdf/plugin-zoom";

export const useZoom = () => useCapability<ZoomPlugin>('zoom');