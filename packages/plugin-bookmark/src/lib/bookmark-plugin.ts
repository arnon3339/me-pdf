import { BasePlugin, PluginRegistry } from '@embedpdf/core';
import { BookmarkCapability, BookmarkPluginConfig } from './types';

export class BookmarkPlugin extends BasePlugin<BookmarkPluginConfig, BookmarkCapability> {
  static readonly id = 'bookmark' as const; 

  constructor(id: string, registry: PluginRegistry) {
    super(id, registry);
  }

  async initialize(config: BookmarkPluginConfig): Promise<void> {
    console.log('initialize', config);
  }

  protected buildCapability(): BookmarkCapability {
    return {

    };
  }
}