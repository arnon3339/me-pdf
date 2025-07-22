import { useCapability, usePlugin } from '@embedpdf/core/@framework';
import { useInteractionManagerCapability } from '@embedpdf/plugin-interaction-manager/@framework';
import { PanPlugin } from '@embedpdf/plugin-pan';
import { useEffect, useState } from '@framework';

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
