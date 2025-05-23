import { BasePlugin, PluginRegistry } from '@embedpdf/core';
import { PdfAnnotationObject, PdfEngine, PdfErrorCode, PdfErrorReason, PdfTaskHelper, Rotation, Task } from '@embedpdf/models';
import { AnnotationCapability, AnnotationPluginConfig, GetPageAnnotationsOptions } from './types';

export class AnnotationPlugin extends BasePlugin<AnnotationPluginConfig, AnnotationCapability> {
  static readonly id = 'annotation' as const; 

  private engine: PdfEngine;

  constructor(id: string, registry: PluginRegistry, engine: PdfEngine) {
    super(id, registry);
    this.engine = engine;
  }

  async initialize(config: AnnotationPluginConfig): Promise<void> {
    console.log('initialize', config);
  }

  protected buildCapability(): AnnotationCapability {
    return {
      getPageAnnotations: (options: GetPageAnnotationsOptions) => {
        return this.getPageAnnotations(options);
      }
    };
  }

  private getPageAnnotations(options: GetPageAnnotationsOptions): Task<PdfAnnotationObject[], PdfErrorReason> {
    const { pageIndex, scaleFactor = 1, rotation = Rotation.Degree0 } = options;

    const doc = this.coreState.core.document;

    if(!doc) {
      throw new Error('document does not open');
    }

    const page = doc.pages.find(p => p.index === pageIndex);

    if(!page) {
      throw new Error('page does not open');
    }

    return this.engine.getPageAnnotations(
      doc,
      page,
      scaleFactor,
      rotation,
    );
  }
}