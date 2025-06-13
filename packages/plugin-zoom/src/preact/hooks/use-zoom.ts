import { useCapability, usePlugin } from '@embedpdf/core/preact';
import { ZoomLevel, ZoomPlugin } from '@embedpdf/plugin-zoom';
import { useEffect, useState } from 'preact/hooks';

export const useZoomCapability = () => useCapability<ZoomPlugin>(ZoomPlugin.id);
export const useZoomPlugin = () => usePlugin<ZoomPlugin>(ZoomPlugin.id);

export const useZoom = () => {
  const { provides: zoomCapability } = useZoomCapability();
  const [currentZoomLevel, setCurrentZoomLevel] = useState<ZoomLevel>(1);
  const [currentZoom, setCurrentZoom] = useState<number>(1);

  useEffect(() => {
    return zoomCapability?.onZoomChange((action) => {
      setCurrentZoomLevel(action.level);
      setCurrentZoom(action.newZoom);
    });
  }, [zoomCapability]);

  return {
    ...zoomCapability,
    currentZoomLevel,
    currentZoom,
  };
};
