import { useCapability, usePlugin } from '@embedpdf/core/svelte';
import { SpreadMode, SpreadPlugin } from '@embedpdf/plugin-spread';

/**
 * Hook to get the spread plugin's capability API.
 * This provides methods for controlling spread mode.
 */
export const useSpreadCapability = () => useCapability<SpreadPlugin>(SpreadPlugin.id);

/**
 * Hook to get the raw spread plugin instance.
 * Useful for accessing plugin-specific properties or methods not exposed in the capability.
 */
export const useSpreadPlugin = () => usePlugin<SpreadPlugin>(SpreadPlugin.id);

/**
 * Hook to manage spread mode state and listen to changes.
 * Returns the capability provider and reactive spread mode.
 */
export const useSpread = () => {
  const { provides } = $derived(useSpreadCapability());
  let spreadMode = $state<SpreadMode>(SpreadMode.None);

  $effect(() => {
    if (!provides) return;

    // Set initial spread mode
    spreadMode = provides.getSpreadMode();

    // Subscribe to spread mode changes
    const unsubscribe = provides.onSpreadChange((newSpreadMode) => {
      spreadMode = newSpreadMode;
    });

    return unsubscribe;
  });

  return {
    get spreadMode() {
      return spreadMode;
    },
    get provides() {
      return provides;
    },
  };
};
