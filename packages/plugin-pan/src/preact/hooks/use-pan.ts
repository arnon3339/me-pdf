import { useCapability, usePlugin } from '@embedpdf/core/preact';
import { PanPlugin } from '@embedpdf/plugin-pan';

export const usePanPlugin = () => usePlugin<PanPlugin>(PanPlugin.id);
export const usePanCapability = () => useCapability<PanPlugin>(PanPlugin.id);
