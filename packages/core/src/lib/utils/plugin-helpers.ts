import { IPlugin, PluginBatchRegistration, PluginPackage } from '../types/plugin';

/**
 * Helper function to create a properly typed plugin registration
 */
export function createPluginRegistration<T extends IPlugin<TConfig>, TConfig>(
  pluginPackage: PluginPackage<T, TConfig>,
  config?: Partial<TConfig>
): PluginBatchRegistration<T, TConfig> {
  return {
    package: pluginPackage,
    config
  };
} 