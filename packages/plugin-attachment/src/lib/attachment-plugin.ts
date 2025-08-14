import { BasePlugin, PluginRegistry } from '@embedpdf/core';

import { AttachmentCapability, AttachmentPluginConfig } from './types';

export class AttachmentPlugin extends BasePlugin<AttachmentPluginConfig, AttachmentCapability> {
  static readonly id = 'attachment' as const;

  constructor(id: string, registry: PluginRegistry) {
    super(id, registry);
  }

  async initialize(_: AttachmentPluginConfig): Promise<void> {}

  protected buildCapability(): AttachmentCapability {
    return {};
  }
}
