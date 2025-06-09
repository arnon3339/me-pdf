import { BasePlugin, createBehaviorEmitter, PluginRegistry, SET_DOCUMENT } from '@embedpdf/core';
import {
  ignore,
  PdfAnnotationObject,
  PdfDocumentObject,
  PdfEngine,
  PdfErrorReason,
  Task,
  PdfAlphaColor,
  PdfAnnotationSubtype,
} from '@embedpdf/models';
import {
  AnnotationCapability,
  AnnotationPluginConfig,
  AnnotationState,
  GetPageAnnotationsOptions,
} from './types';
import {
  setAnnotations,
  selectAnnotation,
  deselectAnnotation,
  setAnnotationMode,
  updateAnnotationColor,
  AnnotationAction,
  updateToolDefaults,
  addColorPreset,
} from './actions';
import {
  InteractionManagerCapability,
  InteractionManagerPlugin,
} from '@embedpdf/plugin-interaction-manager';

export class AnnotationPlugin extends BasePlugin<
  AnnotationPluginConfig,
  AnnotationCapability,
  AnnotationState,
  AnnotationAction
> {
  static readonly id = 'annotation' as const;

  private engine: PdfEngine;
  private readonly state$ = createBehaviorEmitter<AnnotationState>();
  private readonly interactionManager: InteractionManagerCapability | null;

  constructor(id: string, registry: PluginRegistry, engine: PdfEngine) {
    super(id, registry);
    this.engine = engine;

    const interactionManager = registry.getPlugin<InteractionManagerPlugin>('interaction-manager');
    this.interactionManager = interactionManager?.provides() ?? null;
    this.coreStore.onAction(SET_DOCUMENT, (_action, state) => {
      const doc = state.core.document;
      if (doc) {
        this.getAllAnnotations(doc);
      }
    });
  }

  async initialize(): Promise<void> {}

  protected buildCapability(): AnnotationCapability {
    return {
      getPageAnnotations: (options: GetPageAnnotationsOptions) => {
        return this.getPageAnnotations(options);
      },
      selectAnnotation: (pageIndex: number, annotationId: number) => {
        this.selectAnnotation(pageIndex, annotationId);
      },
      deselectAnnotation: () => {
        this.dispatch(deselectAnnotation());
      },
      updateAnnotationColor: async (color: PdfAlphaColor) => {
        return this.updateSelectedAnnotationColor(color);
      },
      setAnnotationMode: (mode: PdfAnnotationSubtype | null) => {
        this.interactionManager?.activate('default');
        this.dispatch(setAnnotationMode(mode));
      },
      getToolDefaults: (subtype) => {
        const defaults = this.state.toolDefaults[subtype];
        if (!defaults) {
          throw new Error(`No defaults found for subtype: ${subtype}`);
        }
        return defaults;
      },
      setToolDefaults: (subtype, patch) => {
        this.dispatch(updateToolDefaults(subtype, patch));
      },
      getColorPresets: () => [...this.state.colorPresets],
      addColorPreset: (color) => this.dispatch(addColorPreset(color)),
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

  private selectAnnotation(pageIndex: number, annotationId: number) {
    const pageAnnotations = this.state.annotations[pageIndex];

    if (!pageAnnotations) {
      return;
    }

    const annotation = pageAnnotations.find((a) => a.id === annotationId);

    if (annotation) {
      this.dispatch(selectAnnotation(pageIndex, annotationId, annotation));
    }
  }

  private async updateSelectedAnnotationColor(color: PdfAlphaColor): Promise<boolean> {
    const selected = this.state.selectedAnnotation;

    if (!selected) {
      return false;
    }

    // Only allow color updates for highlight annotations
    if (selected.annotation.type !== PdfAnnotationSubtype.HIGHLIGHT) {
      return false;
    }

    const doc = this.coreState.core.document;
    if (!doc) {
      return false;
    }

    const page = doc.pages.find((p) => p.index === selected.pageIndex);
    if (!page) {
      return false;
    }

    // Update the annotation in the local state first
    this.dispatch(updateAnnotationColor(selected.pageIndex, selected.annotationId, color));

    try {
      const task = this.engine.setAnnotationColor(doc, page, selected.annotation, color);

      return task.toPromise();
    } catch (error) {
      console.error('Failed to update annotation color:', error);
      return false;
    }
  }
}
