import { useCapability, usePlugin } from '@embedpdf/core/preact';
import { FullscreenPlugin } from '@embedpdf/plugin-fullscreen';

export const useFullscreen = () => usePlugin<FullscreenPlugin>(FullscreenPlugin.id);
export const useFullscreenCapability = () => useCapability<FullscreenPlugin>(FullscreenPlugin.id);
