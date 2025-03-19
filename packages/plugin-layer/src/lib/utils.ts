import { PluginBatchRegistration } from '@embedpdf/core';
import { PluginPackage } from '@embedpdf/core';
import { ILayerPlugin } from './types';

/**
 * Helper function to create a properly typed plugin registration
 */
export function createLayerRegistration<T extends ILayerPlugin<TConfig>, TConfig>(
  pluginPackage: PluginPackage<T, TConfig>,
  config?: Partial<TConfig>
): PluginBatchRegistration<T, TConfig> {
  return {
    package: pluginPackage,
    config
  };
} 