import { BasePlugin, PluginRegistry } from '@embedpdf/core';
import { PrintPluginConfig } from './types';
import { PrintCapability } from './types';

export class PrintPlugin extends BasePlugin<PrintPluginConfig, PrintCapability> {
  static readonly id = 'print' as const;

  constructor(id: string, registry: PluginRegistry) {
    super(id, registry);
  }

  async initialize(config: PrintPluginConfig): Promise<void> {
    console.log('initialize', config);
  }

  protected buildCapability(): PrintCapability {
    return {};
  }
}
