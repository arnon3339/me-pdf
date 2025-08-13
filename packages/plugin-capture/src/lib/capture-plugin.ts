import { BasePlugin, createEmitter, PluginRegistry } from '@embedpdf/core';
import {
  InteractionManagerCapability,
  InteractionManagerPlugin,
} from '@embedpdf/plugin-interaction-manager';
import { RenderCapability, RenderPlugin } from '@embedpdf/plugin-render';

import { CaptureAreaEvent, CaptureCapability, CapturePluginConfig } from './types';
import { ignore, Rect } from '@embedpdf/models';

export class CapturePlugin extends BasePlugin<CapturePluginConfig, CaptureCapability> {
  static readonly id = 'capture' as const;

  private captureArea$ = createEmitter<CaptureAreaEvent>();

  private renderCapability: RenderCapability;
  private interactionManagerCapability: InteractionManagerCapability;
  private config: CapturePluginConfig;

  constructor(id: string, registry: PluginRegistry, config: CapturePluginConfig) {
    super(id, registry);

    this.config = config;

    this.renderCapability = this.registry.getPlugin<RenderPlugin>('render')!.provides();
    this.interactionManagerCapability = this.registry
      .getPlugin<InteractionManagerPlugin>('interaction-manager')!
      .provides();

    this.interactionManagerCapability.registerMode({
      id: 'marqueeCapture',
      scope: 'page',
      exclusive: true,
      cursor: 'crosshair',
    });
  }

  async initialize(_: CapturePluginConfig): Promise<void> {}

  protected buildCapability(): CaptureCapability {
    return {
      onCaptureArea: this.captureArea$.on,
      captureArea: this.captureArea.bind(this),
      enableMarqueeCapture: this.enableMarqueeCapture.bind(this),
      disableMarqueeCapture: this.disableMarqueeCapture.bind(this),
      toggleMarqueeCapture: this.toggleMarqueeCapture.bind(this),
      isMarqueeCaptureActive: () =>
        this.interactionManagerCapability?.getActiveMode() === 'marqueeCapture',
    };
  }

  private captureArea(pageIndex: number, rect: Rect) {
    this.disableMarqueeCapture();

    const task = this.renderCapability.renderPageRect({
      pageIndex,
      rect,
      options: {
        imageType: this.config.imageType,
        scaleFactor: this.config.scale,
        withAnnotations: this.config.withAnnotations || false,
      },
    });

    task.wait((blob) => {
      this.captureArea$.emit({
        pageIndex,
        rect,
        blob,
        imageType: this.config.imageType || 'image/png',
        scale: this.config.scale || 1,
        withAnnotations: this.config.withAnnotations || false,
      });
    }, ignore);
  }

  private enableMarqueeCapture() {
    this.interactionManagerCapability?.activate('marqueeCapture');
  }

  private disableMarqueeCapture() {
    this.interactionManagerCapability?.activateDefaultMode();
  }

  private toggleMarqueeCapture() {
    if (this.interactionManagerCapability?.getActiveMode() === 'marqueeCapture') {
      this.interactionManagerCapability?.activateDefaultMode();
    } else {
      this.interactionManagerCapability?.activate('marqueeCapture');
    }
  }
}
