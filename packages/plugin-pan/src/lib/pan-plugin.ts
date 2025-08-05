import { BasePlugin, PluginRegistry } from '@embedpdf/core';
import {
  InteractionManagerCapability,
  InteractionManagerPlugin,
} from '@embedpdf/plugin-interaction-manager';

import { PanCapability, PanPluginConfig } from './types';

export class PanPlugin extends BasePlugin<PanPluginConfig, PanCapability> {
  static readonly id = 'pan' as const;

  private interactionManager: InteractionManagerCapability;
  public config: PanPluginConfig;

  constructor(id: string, registry: PluginRegistry, config: PanPluginConfig) {
    super(id, registry);

    this.config = config;

    this.interactionManager = registry
      .getPlugin<InteractionManagerPlugin>(InteractionManagerPlugin.id)
      ?.provides()!;

    this.interactionManager.registerMode({
      id: 'panMode',
      scope: 'global',
      exclusive: false,
      cursor: 'grab',
      wantsRawTouch: false,
    });

    if (config.defaultMode === 'always') {
      this.makePanDefault(true);
    }
  }

  async initialize(_: PanPluginConfig): Promise<void> {}

  private makePanDefault(autoActivate: boolean = true) {
    this.interactionManager.setDefaultMode('panMode');
    if (autoActivate) {
      this.interactionManager.activateDefaultMode();
    }
  }

  protected buildCapability(): PanCapability {
    return {
      makePanDefault: (autoActivate: boolean = true) => this.makePanDefault(autoActivate),
      enablePan: () => this.interactionManager.activate('panMode'),
      disablePan: () => this.interactionManager.activateDefaultMode(),
      togglePan: () => {
        if (this.interactionManager.getActiveMode() === 'panMode') {
          this.interactionManager.activateDefaultMode();
        } else {
          this.interactionManager.activate('panMode');
        }
      },
    };
  }
}
