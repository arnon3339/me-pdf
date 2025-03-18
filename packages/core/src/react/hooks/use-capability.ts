import { useContext } from "react";
import { PDFContext } from "../context";
import type { IPlugin } from '@embedpdf/core';

/**
 * Hook to access a plugin's capability.
 * @param pluginId The ID of the plugin to access
 * @returns The capability provided by the plugin
 * @example
 * // Get zoom capability
 * const zoom = useCapability<ZoomPlugin>('zoom');
 */
export function useCapability<T extends IPlugin<any>>(pluginId: string): ReturnType<NonNullable<T['provides']>> {
  const registry = useContext(PDFContext);
  if (!registry) {
    throw new Error('useCapability must be used within a PDFViewer');
  }

  const plugin = registry.getPlugin<T>(pluginId);

  if(!plugin.provides) {
    throw new Error(`Plugin ${pluginId} does not provide a capability`);
  }

  return plugin.provides();
}