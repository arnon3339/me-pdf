import { useCapability, usePlugin } from '@embedpdf/core/react';
import { ZoomPlugin } from '@embedpdf/plugin-zoom';

export const useZoomCapability = () => useCapability<ZoomPlugin>(ZoomPlugin.id);
export const useZoom = () => usePlugin<ZoomPlugin>(ZoomPlugin.id);
