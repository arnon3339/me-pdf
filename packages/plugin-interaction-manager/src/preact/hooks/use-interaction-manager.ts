import { useCapability, usePlugin } from '@embedpdf/core/preact';
import {
  InteractionManagerPlugin,
  PointerEventHandlers,
  RegisterHandlersOptions,
} from '@embedpdf/plugin-interaction-manager';

export const useInteractionManager = () =>
  usePlugin<InteractionManagerPlugin>(InteractionManagerPlugin.id);
export const useInteractionManagerCapability = () =>
  useCapability<InteractionManagerPlugin>(InteractionManagerPlugin.id);
export function useCursor() {
  const { provides } = useInteractionManagerCapability();
  return {
    setCursor: (token: string, cursor: string, prio = 0) => {
      provides?.setCursor(token, cursor, prio);
    },
    removeCursor: (token: string) => {
      provides?.removeCursor(token);
    },
  };
}

interface UsePointerHandlersOptions {
  modeId?: string;
  pageIndex?: number;
}

export function usePointerHandlers({ modeId, pageIndex }: UsePointerHandlersOptions) {
  const { provides } = useInteractionManagerCapability();
  return {
    register: modeId
      ? (handlers: PointerEventHandlers) =>
          provides?.registerHandlers({ modeId, handlers, pageIndex })
      : (handlers: PointerEventHandlers) =>
          provides?.registerAlways({
            scope: pageIndex !== undefined ? { type: 'page', pageIndex } : { type: 'global' },
            handlers,
          }),
  };
}
