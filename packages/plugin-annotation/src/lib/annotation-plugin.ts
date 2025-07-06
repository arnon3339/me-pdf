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
  HistoryInfo,
  StylableSubtype,
} from './types';
import {
  setAnnotations,
  selectAnnotation,
  deselectAnnotation,
  setAnnotationMode,
  AnnotationAction,
  updateToolDefaults,
  addColorPreset,
  createAnnotation,
  patchAnnotation,
  deleteAnnotation,
  redo,
  undo,
} from './actions';
import {
  InteractionManagerCapability,
  InteractionManagerPlugin,
  InteractionMode,
} from '@embedpdf/plugin-interaction-manager';
import { SelectionPlugin, SelectionCapability } from '@embedpdf/plugin-selection';
import { getSelectedAnnotation } from './selectors';

export class AnnotationPlugin extends BasePlugin<
  AnnotationPluginConfig,
  AnnotationCapability,
  AnnotationState,
  AnnotationAction
> {
  static readonly id = 'annotation' as const;

  private readonly config: AnnotationPluginConfig;

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
  private readonly history$ = createBehaviorEmitter<HistoryInfo>({
    canUndo: false,
    canRedo: false,
    hasPendingChanges: false,
  });

  constructor(
    id: string,
    registry: PluginRegistry,
    engine: PdfEngine,
    config: AnnotationPluginConfig,
  ) {
    super(id, registry);
    this.engine = engine;
    this.config = config;

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

    this.selection?.onEndSelection(() => {
      if (!this.state.annotationMode) return;

      const formattedSelection = this.selection?.getFormattedSelection();
      if (!formattedSelection) return;

      for (const selection of formattedSelection) {
        const rect = selection.rect;
        const segmentRects = selection.segmentRects;
        const type = this.state.annotationMode;
        const color = this.state.toolDefaults[type].color;
        const opacity = this.state.toolDefaults[type].opacity;

        this.createAnnotation(selection.pageIndex, {
          type,
          rect,
          segmentRects,
          color,
          opacity,
          pageIndex: selection.pageIndex,
          id: Date.now(),
        });
      }

      this.selection?.clear();
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
      getSelectedAnnotation: () => {
        return getSelectedAnnotation(this.state);
      },
      selectAnnotation: (pageIndex: number, annotationId: number) => {
        this.selectAnnotation(pageIndex, annotationId);
      },
      deselectAnnotation: () => {
        this.dispatch(deselectAnnotation());
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
      createAnnotation: (pageIndex: number, annotation: PdfAnnotationObject) =>
        this.createAnnotation(pageIndex, annotation),
      updateAnnotation: (
        pageIndex: number,
        annotationId: number,
        patch: Partial<PdfAnnotationObject>,
      ) => this.updateAnnotation(pageIndex, annotationId, patch),
      deleteAnnotation: (pageIndex: number, annotationId: number) =>
        this.deleteAnnotation(pageIndex, annotationId),
      undo: () => this.dispatch(undo()),
      redo: () => this.dispatch(redo()),
      canUndo: () => this.state.past.length > 0,
      canRedo: () => this.state.future.length > 0,
      onStateChange: this.state$.on,
      onModeChange: this.modeChange$.on,
      onActiveToolChange: this.activeTool$.on,
      onHistoryChange: this.history$.on,
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
    this.history$.emit({
      canUndo: next.past.length > 0,
      canRedo: next.future.length > 0,
      hasPendingChanges: next.hasPendingChanges,
    });
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
    this.dispatch(selectAnnotation(pageIndex, annotationId));
  }

  private createAnnotation(pageIndex: number, anno: PdfAnnotationObject) {
    /* local optimistic insert */
    this.dispatch(createAnnotation(pageIndex, anno));
    if (this.config.autoCommit !== false) this.commit();
  }

  private updateAnnotation(
    pageIndex: number,
    annotationId: number,
    patch: Partial<PdfAnnotationObject>,
  ) {
    this.dispatch(patchAnnotation(pageIndex, annotationId, patch));
    if (this.config.autoCommit !== false) this.commit();
  }

  private deleteAnnotation(pageIndex: number, annotationId: number) {
    this.dispatch(deselectAnnotation());
    this.dispatch(deleteAnnotation(pageIndex, annotationId));
    if (this.config.autoCommit !== false) this.commit();
  }

  private commit() {}
}
