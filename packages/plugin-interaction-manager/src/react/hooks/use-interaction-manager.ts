import { useCapability, usePlugin } from '@embedpdf/core/preact';
import { InteractionManagerPlugin } from '@embedpdf/plugin-interaction-manager';

export const useInteractionManager = () =>
  usePlugin<InteractionManagerPlugin>(InteractionManagerPlugin.id);
export const useInteractionManagerCapability = () =>
  useCapability<InteractionManagerPlugin>(InteractionManagerPlugin.id);
