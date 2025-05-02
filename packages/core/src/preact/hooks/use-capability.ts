import type { IPlugin } from '@embedpdf/core';
import { useRegistry } from "./use-registry";

/**
 * Hook to access a plugin's capability.
 * @param pluginId The ID of the plugin to access
 * @returns The capability provided by the plugin or null during initialization
 * @example
 * // Get zoom capability
 * const zoom = useCapability<ZoomPlugin>('zoom');
 */
export function useCapability<T extends IPlugin<any>>(pluginId: string): ReturnType<NonNullable<T['provides']>> | null {
  const registry = useRegistry();
  
  // If registry is null (during initialization), useRegistry will return null
  if (registry === null) {
    return null;
  }

  const plugin = registry.getPlugin<T>(pluginId);

  if(!plugin) {
    throw new Error(`Plugin ${pluginId} not found`);
  }

  if(!plugin.provides) {
    throw new Error(`Plugin ${pluginId} does not provide a capability`);
  }

  return plugin.provides();
} 