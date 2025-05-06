import { useCapability } from "@embedpdf/core/preact";
import { RenderPlugin } from "@embedpdf/plugin-render";

export const useRender = () => useCapability<RenderPlugin>('render');