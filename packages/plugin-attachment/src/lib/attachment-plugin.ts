import { BasePlugin, PluginRegistry } from '@embedpdf/core';
import { PdfEngine } from '@embedpdf/models';

import { AttachmentCapability, AttachmentPluginConfig } from './types';

export class AttachmentPlugin extends BasePlugin<AttachmentPluginConfig, AttachmentCapability> {
  static readonly id = 'attachment' as const;

  private engine: PdfEngine;

  constructor(id: string, registry: PluginRegistry, engine: PdfEngine) {
    super(id, registry);

    this.engine = engine;
  }

  async initialize(_: AttachmentPluginConfig): Promise<void> {}

  protected buildCapability(): AttachmentCapability {
    return {};
  }
}
