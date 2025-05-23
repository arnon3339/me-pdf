import { useContext } from 'react';
import { PDFContext } from '../context';
import type { IPlugin } from '@embedpdf/core';

/**
 * Hook to access a plugin's capability.
 * @param pluginId The ID of the plugin to access
 * @returns The capability provided by the plugin
 * @example
 * // Get zoom capability
 * const zoom = useCapability<ZoomPlugin>('zoom');
 */
export function useCapability<T extends IPlugin<any>>(
  pluginId: string,
): ReturnType<NonNullable<T['provides']>> | null {
  const contextValue = useContext(PDFContext);

  // Error if used outside of context
  if (contextValue === undefined) {
    throw new Error('useCapability must be used within a PDFContext.Provider');
  }

  const { registry, isInitializing } = contextValue;

  // During initialization, return null instead of throwing an error
  if (isInitializing) {
    return null;
  }

  // At this point, initialization is complete but registry is still null, which is unexpected
  if (registry === null) {
    throw new Error('PDF registry failed to initialize properly');
  }

  const plugin = registry.getPlugin<T>(pluginId);

  if (!plugin) {
    throw new Error(`Plugin ${pluginId} not found`);
  }

  if (!plugin.provides) {
    throw new Error(`Plugin ${pluginId} does not provide a capability`);
  }

  return plugin.provides();
}
