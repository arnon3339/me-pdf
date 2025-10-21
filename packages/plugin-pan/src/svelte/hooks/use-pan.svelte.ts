import { useCapability, usePlugin } from '@embedpdf/core/svelte';
import { PanPlugin } from '@embedpdf/plugin-pan';

export const usePanPlugin = () => usePlugin<PanPlugin>(PanPlugin.id);
export const usePanCapability = () => useCapability<PanPlugin>(PanPlugin.id);

export const usePan = () => {
  const { provides } = $derived(usePanCapability());
  let isPanning = $state(false);

  $effect(() => {
    if (!provides) return;
    return provides.onPanModeChange((isPanningState) => {
      isPanning = isPanningState;
    });
  });

  return {
    get provides() {
      return provides;
    },
    get isPanning() {
      return isPanning;
    },
  };
};
