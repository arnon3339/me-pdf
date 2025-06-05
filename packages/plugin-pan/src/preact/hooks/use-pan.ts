import { useCapability, usePlugin } from '@embedpdf/core/preact';
import { PanPlugin } from '@embedpdf/plugin-pan';

export const usePan = () => usePlugin<PanPlugin>(PanPlugin.id);
export const usePanCapability = () => useCapability<PanPlugin>(PanPlugin.id);
