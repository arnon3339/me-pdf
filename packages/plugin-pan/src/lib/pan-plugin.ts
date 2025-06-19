import { BasePlugin, PluginRegistry } from '@embedpdf/core';
import {
  InteractionManagerCapability,
  InteractionManagerPlugin,
} from '@embedpdf/plugin-interaction-manager';

import { PanCapability, PanPluginConfig } from './types';

export class PanPlugin extends BasePlugin<PanPluginConfig, PanCapability> {
  static readonly id = 'pan' as const;

  private interactionManager: InteractionManagerCapability;

  constructor(id: string, registry: PluginRegistry) {
    super(id, registry);

    this.interactionManager = registry
      .getPlugin<InteractionManagerPlugin>(InteractionManagerPlugin.id)
      ?.provides()!;

    this.interactionManager.registerMode({
      id: 'panMode',
      scope: 'global',
      exclusive: false,
      cursor: 'grab',
    });
  }

  async initialize(_: PanPluginConfig): Promise<void> {}

  protected buildCapability(): PanCapability {
    return {
      enablePan: () => this.interactionManager.activate('panMode'),
      disablePan: () => this.interactionManager.activate('default'),
      togglePan: () => {
        if (this.interactionManager.getActiveMode() === 'panMode') {
          this.interactionManager.activate('default');
        } else {
          this.interactionManager.activate('panMode');
        }
      },
    };
  }
}
