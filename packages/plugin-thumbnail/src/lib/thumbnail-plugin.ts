import { BasePlugin, PluginRegistry } from '@embedpdf/core';
import { ThumbnailPluginConfig } from './types';
import { ThumbnailCapability } from './types';

export class ThumbnailPlugin extends BasePlugin<ThumbnailPluginConfig, ThumbnailCapability> {
  static readonly id = 'thumbnail' as const; 

  constructor(id: string, registry: PluginRegistry) {
    super(id, registry);
  }

  async initialize(config: ThumbnailPluginConfig): Promise<void> {
    console.log('initialize', config);
  }

  protected buildCapability(): ThumbnailCapability {
    return {

    };
  }
}