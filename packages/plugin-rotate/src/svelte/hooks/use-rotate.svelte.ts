import { useCapability, usePlugin } from '@embedpdf/core/svelte';
import { Rotation } from '@embedpdf/models';
import { RotatePlugin } from '@embedpdf/plugin-rotate';

/**
 * Hook to get the raw rotate plugin instance.
 */
export const useRotatePlugin = () => usePlugin<RotatePlugin>(RotatePlugin.id);

/**
 * Hook to get the rotate plugin's capability API.
 * This provides methods for rotating the document.
 */
export const useRotateCapability = () => useCapability<RotatePlugin>(RotatePlugin.id);

/**
 * Hook that provides reactive rotation state and methods.
 */
export const useRotate = () => {
  const { provides } = useRotateCapability();
  let rotation = $state<Rotation>(0);

  $effect(() => {
    if (!provides) return;

    const unsubscribe = provides.onRotateChange((newRotation) => {
      rotation = newRotation;
    });

    return unsubscribe;
  });

  return {
    get rotation() {
      return rotation;
    },
    provides,
  };
};
