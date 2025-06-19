import { useCapability, usePlugin } from '@embedpdf/core/react';
import { useInteractionManagerCapability } from '@embedpdf/plugin-interaction-manager/react';
import { PanPlugin } from '@embedpdf/plugin-pan';
import { useEffect, useState } from 'react';

export const usePanPlugin = () => usePlugin<PanPlugin>(PanPlugin.id);
export const usePanCapability = () => useCapability<PanPlugin>(PanPlugin.id);

export const usePan = () => {
  const { provides } = usePanCapability();
  const { provides: interactionManager } = useInteractionManagerCapability();

  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    if (!interactionManager) return;
    return interactionManager.onStateChange((state) => {
      setIsPanning(state.activeMode === 'panMode');
    });
  }, [interactionManager]);

  return {
    provides,
    isPanning,
  };
};
