import { useCapability, usePlugin } from '@embedpdf/core/svelte';
import { ViewportPlugin } from '@embedpdf/plugin-viewport';
export const useViewportPlugin = () => usePlugin(ViewportPlugin.id);
export const useViewportCapability = () => useCapability(ViewportPlugin.id);
