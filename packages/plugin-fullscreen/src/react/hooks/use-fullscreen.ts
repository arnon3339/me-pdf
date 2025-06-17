import { useCapability, usePlugin } from '@embedpdf/core/react';
import { FullscreenPlugin } from '@embedpdf/plugin-fullscreen';

export const useFullscreenPlugin = () => usePlugin<FullscreenPlugin>(FullscreenPlugin.id);
export const useFullscreenCapability = () => useCapability<FullscreenPlugin>(FullscreenPlugin.id);
