import { useCapability, usePlugin } from '@embedpdf/core/svelte';
import { RenderPlugin } from '@embedpdf/plugin-render';
export const useRenderPlugin = () => usePlugin(RenderPlugin.id);
export const useRenderCapability = () => useCapability(RenderPlugin.id);
