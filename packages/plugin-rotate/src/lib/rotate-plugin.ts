import { BasePlugin, createBehaviorEmitter, PluginRegistry, setPages, setRotation } from '@embedpdf/core';
import { PdfDocumentObject, PdfPageObject, Rotation, transformSize } from '@embedpdf/models';
import { LoaderPlugin } from '@embedpdf/plugin-loader';
import { SpreadCapability, SpreadPlugin } from '@embedpdf/plugin-spread';
import { RotateCapability, RotatePluginConfig } from './types';

function getNextRotation(current: Rotation): Rotation {
  return ((current + 1) % 4) as Rotation;
}

function getPreviousRotation(current: Rotation): Rotation {
  return ((current + 3) % 4) as Rotation; // +3 is equivalent to -1 in modulo 4
}

export class RotatePlugin extends BasePlugin<RotatePluginConfig, RotateCapability> {
  static readonly id = 'rotate' as const;
  private readonly rotate$ = createBehaviorEmitter<Rotation>();
  private originalPages: PdfPageObject[] = [];
  private spread: SpreadCapability | null;

  constructor(id: string, registry: PluginRegistry, cfg: RotatePluginConfig) {
    super(id, registry);
    this.resetReady();
    const loaderPlugin = registry.getPlugin<LoaderPlugin>('loader');
    loaderPlugin!.provides().onDocumentLoaded((document) => this.documentLoaded(document, cfg));
    const spreadPlugin = registry.getPlugin<SpreadPlugin>('spread');
    this.spread = spreadPlugin ? spreadPlugin.provides() : null;
  }

  async initialize(_config: RotatePluginConfig): Promise<void> {}

  private documentLoaded(document: PdfDocumentObject, cfg: RotatePluginConfig): void {
    const rotation = cfg.defaultRotation ?? this.getCoreState().core.rotation;
    this.originalPages = document.pages;
    this.setRotation(rotation);
    this.markReady();
  }

  private setRotation(rotation: Rotation): void {
    const pages = this.getCoreState().core.pages;
    if (!pages) {
      throw new Error('Pages not loaded');
    }

    const rotated = this.originalPages.map(p => ({
      ...p,
      size: transformSize(p.size, rotation, 1),
    }));
    this.dispatchCoreAction(setPages(this.spread ? this.spread.getSpreadPagesObjects(rotated) : rotated.map(p => [p])));
    this.dispatchCoreAction(setRotation(rotation));
  }

  private rotateForward(): void {
    const rotation = getNextRotation(this.getCoreState().core.rotation);
    this.setRotation(rotation);
  }

  private rotateBackward(): void {
    const rotation = getPreviousRotation(this.getCoreState().core.rotation);
    this.setRotation(rotation);
  }

  protected buildCapability(): RotateCapability {
    return {
      onRotateChange: this.rotate$.on,
      setRotation: (rotation) => this.setRotation(rotation),
      getRotation: () => this.getCoreState().core.rotation,
      rotateForward: () => this.rotateForward(),
      rotateBackward: () => this.rotateBackward(),
    };
  }

  async destroy(): Promise<void> {
    this.rotate$.clear();
    super.destroy();
  }
}
