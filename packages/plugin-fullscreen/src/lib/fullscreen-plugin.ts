import { BasePlugin, PluginRegistry } from '@embedpdf/core';
import { FullscreenCapability, FullscreenPluginConfig } from './types';

export class FullscreenPlugin extends BasePlugin<FullscreenPluginConfig, FullscreenCapability> {
  static readonly id = 'fullscreen' as const;

  constructor(id: string, registry: PluginRegistry) {
    super(id, registry);
  }

  async initialize(config: FullscreenPluginConfig): Promise<void> {
    console.log('initialize', config);
  }

  protected buildCapability(): FullscreenCapability {
    return {};
  }
}
