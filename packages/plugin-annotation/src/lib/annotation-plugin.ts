import {
  BasePlugin,
  createBehaviorEmitter,
  enumEntries,
  PluginRegistry,
  SET_DOCUMENT,
} from '@embedpdf/core';
import {
  ignore,
  PdfAnnotationObject,
  PdfDocumentObject,
  PdfEngine,
  PdfErrorReason,
  Task,
  PdfAnnotationSubtype,
  WebAlphaColor,
  PdfTask,
  PdfTaskHelper,
  PdfErrorCode,
} from '@embedpdf/models';
import {
  ActiveTool,
  AnnotationCapability,
  AnnotationPluginConfig,
  AnnotationState,
  BaseAnnotationDefaults,
  GetPageAnnotationsOptions,
  StylableSubtype,
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
  InteractionMode,
} from '@embedpdf/plugin-interaction-manager';
import { SelectionPlugin, SelectionCapability } from '@embedpdf/plugin-selection';

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
  private readonly selection: SelectionCapability | null;

  /** Map <subtype> → <modeId>.  Filled once in `initialize()`. */
  private readonly modeBySubtype = new Map<StylableSubtype, string>();
  /** The inverse map for quick lookup in onModeChange().          */
  private readonly subtypeByMode = new Map<string, StylableSubtype>();
  private readonly modeChange$ = createBehaviorEmitter<StylableSubtype | null>();
  private readonly activeTool$ = createBehaviorEmitter<ActiveTool>({
    mode: null,
    defaults: null,
  });

  constructor(id: string, registry: PluginRegistry, engine: PdfEngine) {
    super(id, registry);
    this.engine = engine;

    const selection = registry.getPlugin<SelectionPlugin>('selection');
    this.selection = selection?.provides() ?? null;

    const interactionManager = registry.getPlugin<InteractionManagerPlugin>('interaction-manager');
    this.interactionManager = interactionManager?.provides() ?? null;

    this.coreStore.onAction(SET_DOCUMENT, (_action, state) => {
      const doc = state.core.document;
      if (doc) {
        this.getAllAnnotations(doc);
      }
    });
  }

  async initialize(): Promise<void> {
    for (const [subtype, defaults] of enumEntries(this.state.toolDefaults)) {
      this.registerTool(subtype, defaults);
    }

    this.interactionManager?.onModeChange((s) => {
      const newSubtype = this.subtypeByMode.get(s.activeMode) ?? null;
      if (newSubtype !== this.state.annotationMode) {
        this.dispatch(setAnnotationMode(newSubtype));
        this.modeChange$.emit(newSubtype);
      }
    });
  }

  private registerTool(subtype: StylableSubtype, defaults: BaseAnnotationDefaults) {
    const modeId = defaults.interaction.mode;
    const interactionMode: InteractionMode = {
      id: modeId,
      scope: 'page',
      exclusive: defaults.interaction.exclusive,
      cursor: defaults.interaction.cursor,
    };

    this.interactionManager?.registerMode(interactionMode);

    if (defaults.textSelection) {
      this.selection?.enableForMode(modeId);
    }
    this.modeBySubtype.set(subtype, modeId);
    this.subtypeByMode.set(modeId, subtype);
  }

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
      updateAnnotationColor: (options: WebAlphaColor) => {
        return this.updateSelectedAnnotationColor(options);
      },
      getAnnotationMode: () => {
        return this.state.annotationMode;
      },
      setAnnotationMode: (subtype: StylableSubtype | null) => {
        if (subtype === this.state.annotationMode) return;
        if (subtype) {
          const mode = this.modeBySubtype.get(subtype);
          if (!mode) throw new Error(`Mode missing for subtype ${subtype}`);
          this.interactionManager?.activate(mode);
        } else {
          this.interactionManager?.activate('default');
        }
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
      onModeChange: this.modeChange$.on,
      onActiveToolChange: this.activeTool$.on,
    };
  }

  private emitActiveTool(state: AnnotationState) {
    const mode = state.annotationMode;
    this.activeTool$.emit({
      mode,
      defaults: mode ? state.toolDefaults[mode] : null,
    });
  }

  override onStoreUpdated(prev: AnnotationState, next: AnnotationState): void {
    this.state$.emit(next);

    if (
      prev.annotationMode !== next.annotationMode ||
      prev.toolDefaults[prev.annotationMode ?? PdfAnnotationSubtype.HIGHLIGHT] !==
        next.toolDefaults[next.annotationMode ?? PdfAnnotationSubtype.HIGHLIGHT]
    ) {
      this.emitActiveTool(next);
    }
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
      return PdfTaskHelper.reject({ code: PdfErrorCode.NotFound, message: 'Document not found' });
    }

    const page = doc.pages.find((p) => p.index === pageIndex);

    if (!page) {
      return PdfTaskHelper.reject({ code: PdfErrorCode.NotFound, message: 'Page not found' });
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

  private updateSelectedAnnotationColor(webAlphaColor: WebAlphaColor): PdfTask<boolean> {
    const selected = this.state.selectedAnnotation;

    if (!selected) {
      return PdfTaskHelper.reject({
        code: PdfErrorCode.NotFound,
        message: 'No annotation selected',
      });
    }

    // Only allow color updates for highlight annotations
    if (selected.annotation.type !== PdfAnnotationSubtype.HIGHLIGHT) {
      return PdfTaskHelper.reject({
        code: PdfErrorCode.NotSupport,
        message: 'Only highlight annotations can be updated',
      });
    }

    const doc = this.coreState.core.document;
    if (!doc) {
      return PdfTaskHelper.reject({ code: PdfErrorCode.NotFound, message: 'Document not found' });
    }

    const page = doc.pages.find((p) => p.index === selected.pageIndex);
    if (!page) {
      return PdfTaskHelper.reject({ code: PdfErrorCode.NotFound, message: 'Page not found' });
    }

    // Update the annotation in the local state first
    this.dispatch(updateAnnotationColor(selected.pageIndex, selected.annotationId, webAlphaColor));

    return this.engine.updateAnnotationColor(doc, page, selected.annotation, webAlphaColor);
  }
}
