import { useCapability, usePlugin } from '@embedpdf/core/react';
import { RenderPlugin } from '@embedpdf/plugin-render';

export const useRender = () => usePlugin<RenderPlugin>(RenderPlugin.id);
export const useRenderCapability = () => useCapability<RenderPlugin>(RenderPlugin.id);
