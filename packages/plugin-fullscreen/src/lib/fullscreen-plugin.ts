import { BasePlugin, createEmitter, PluginRegistry } from '@embedpdf/core';
import { FullscreenCapability, FullscreenPluginConfig, FullscreenState } from './types';
import { FullscreenAction, setFullscreen } from './actions';

export class FullscreenPlugin extends BasePlugin<
  FullscreenPluginConfig,
  FullscreenCapability,
  FullscreenState,
  FullscreenAction
> {
  static readonly id = 'fullscreen' as const;

  private readonly fullscreenRequest$ = createEmitter<'enter' | 'exit'>();

  constructor(id: string, registry: PluginRegistry) {
    super(id, registry);
  }

  async initialize(_: FullscreenPluginConfig): Promise<void> {}

  protected buildCapability(): FullscreenCapability {
    return {
      isFullscreen: () => this.state.isFullscreen,
      enableFullscreen: () => this.fullscreenRequest$.emit('enter'),
      exitFullscreen: () => this.fullscreenRequest$.emit('exit'),
      onRequest: this.fullscreenRequest$.on,
    };
  }

  public setFullscreenState(isFullscreen: boolean): void {
    this.dispatch(setFullscreen(isFullscreen));
  }

  async destroy(): Promise<void> {
    this.fullscreenRequest$.clear();
    super.destroy();
  }
}
