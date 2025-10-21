import { useCapability, usePlugin } from '@embedpdf/core/svelte';
import { FullscreenPlugin, FullscreenState, initialState } from '@embedpdf/plugin-fullscreen';

export const useFullscreenPlugin = () => usePlugin<FullscreenPlugin>(FullscreenPlugin.id);
export const useFullscreenCapability = () => useCapability<FullscreenPlugin>(FullscreenPlugin.id);

export const useFullscreen = () => {
  const { provides } = $derived(useFullscreenCapability());
  const state = $state<FullscreenState>(initialState);

  $effect(() => {
    if (!provides) return;
    return provides.onStateChange((newState) => {
      state.isFullscreen = newState.isFullscreen;
    });
  });

  return {
    get provides() {
      return provides;
    },
    get state() {
      return state;
    },
  };
};
