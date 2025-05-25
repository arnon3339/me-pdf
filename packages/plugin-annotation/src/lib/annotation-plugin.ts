import { BasePlugin, createBehaviorEmitter, PluginRegistry, SET_DOCUMENT } from '@embedpdf/core';
import {
  ignore,
  PdfAnnotationObject,
  PdfDocumentObject,
  PdfEngine,
  PdfErrorReason,
  Task,
} from '@embedpdf/models';
import {
  AnnotationCapability,
  AnnotationPluginConfig,
  AnnotationState,
  GetPageAnnotationsOptions,
} from './types';
import { setAnnotations } from './actions';

export class AnnotationPlugin extends BasePlugin<AnnotationPluginConfig, AnnotationCapability> {
  static readonly id = 'annotation' as const;

  private engine: PdfEngine;

  private readonly state$ = createBehaviorEmitter<AnnotationState>();

  constructor(id: string, registry: PluginRegistry, engine: PdfEngine) {
    super(id, registry);
    this.engine = engine;

    this.coreStore.onAction(SET_DOCUMENT, (_action, state) => {
      const doc = state.core.document;
      if (doc) {
        this.getAllAnnotations(doc);
      }
    });
  }

  async initialize(config: AnnotationPluginConfig): Promise<void> {
    console.log('initialize', config);
  }

  protected buildCapability(): AnnotationCapability {
    return {
      getPageAnnotations: (options: GetPageAnnotationsOptions) => {
        return this.getPageAnnotations(options);
      },
      onStateChange: this.state$.on,
    };
  }

  override onStoreUpdated(_prevState: AnnotationState, newState: AnnotationState): void {
    this.state$.emit(newState);
  }

  private getAllAnnotations(doc: PdfDocumentObject) {
    const task = this.engine.getAllAnnotations(doc);
    task.wait((annotations) => this.dispatch(setAnnotations(annotations)), ignore);
  }

  private getPageAnnotations(
    options: GetPageAnnotationsOptions,
  ): Task<PdfAnnotationObject[], PdfErrorReason> {
    const { pageIndex } = options;

    const doc = this.coreState.core.document;

    if (!doc) {
      throw new Error('document does not open');
    }

    const page = doc.pages.find((p) => p.index === pageIndex);

    if (!page) {
      throw new Error('page does not open');
    }

    return this.engine.getPageAnnotations(doc, page);
  }
}
