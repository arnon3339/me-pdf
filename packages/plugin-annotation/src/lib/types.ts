import { BasePluginConfig, EventHook } from '@embedpdf/core';
import {
  PdfAnnotationObject,
  PdfErrorReason,
  Task,
  PdfAnnotationSubtype,
  WebAlphaColor,
  PdfTask,
} from '@embedpdf/models';

/* Metadata tracked per anno */
export type CommitState =
  | 'new' // created locally, not yet written to the PDF
  | 'dirty' // exists remotely, but local fields diverge
  | 'deleted' // deleted locally, not yet written to the PDF
  | 'synced' // identical to the PDF
  | 'ignored'; // managed by a different plugin – never auto-committed

export interface TrackedAnnotation {
  /** A stable, client-side unique identifier for history and state management. */
  localId: number;
  /**
   * If the engine has already created the annotation in the PDF
   * this is the definitive id coming from the engine.
   * It is **never** cleared once set.
   */
  pdfId?: number;
  /** local commit bookkeeping */
  commitState: CommitState;
  /** the actual annotation object */
  object: PdfAnnotationObject;
}

export interface BaseAnnotationDefaults extends WebAlphaColor {
  interaction: {
    mode: string;
    exclusive: boolean;
    cursor?: string;
  };
  textSelection?: boolean;
}

export interface HighlightDefaults extends BaseAnnotationDefaults {
  name: 'Highlight';
}

export interface UnderlineDefaults extends BaseAnnotationDefaults {
  name: 'Underline';
}

export interface StrikeoutDefaults extends BaseAnnotationDefaults {
  name: 'Strikeout';
}

export interface SquigglyDefaults extends BaseAnnotationDefaults {
  name: 'Squiggly';
}

export type AnnotationDefaults =
  | HighlightDefaults
  | UnderlineDefaults
  | StrikeoutDefaults
  | SquigglyDefaults;

export type ToolDefaultsBySubtype = {
  [PdfAnnotationSubtype.HIGHLIGHT]: HighlightDefaults;
  [PdfAnnotationSubtype.UNDERLINE]: UnderlineDefaults;
  [PdfAnnotationSubtype.STRIKEOUT]: StrikeoutDefaults;
  [PdfAnnotationSubtype.SQUIGGLY]: SquigglyDefaults;
};

export type StylableSubtype = keyof ToolDefaultsBySubtype;

export type ToolDefaults<S extends PdfAnnotationSubtype> = ToolDefaultsBySubtype[Extract<
  S,
  keyof ToolDefaultsBySubtype
>];

export interface ActiveTool {
  mode: StylableSubtype | null;
  defaults: AnnotationDefaults | null; // ⇐ null when no mode active
}

export interface AnnotationState {
  pages: Record<number, string[]>; // pageIndex → list of UIDs
  byUid: Record<string, TrackedAnnotation>; // UID → latest object

  selectedUid: string | null;
  annotationMode: StylableSubtype | null;

  toolDefaults: ToolDefaultsBySubtype;
  colorPresets: string[];

  hasPendingChanges: boolean;
}

export interface AnnotationPluginConfig extends BasePluginConfig {
  toolDefaults?: Partial<ToolDefaultsBySubtype>;
  colorPresets?: string[];
  /**
   * When `false` mutations are kept in memory and must be
   * flushed with `commitPendingChanges()`.
   */
  autoCommit?: boolean;
}

export interface AnnotationCapability {
  getPageAnnotations: (
    options: GetPageAnnotationsOptions,
  ) => Task<PdfAnnotationObject[], PdfErrorReason>;
  getSelectedAnnotation: () => TrackedAnnotation | null;
  selectAnnotation: (pageIndex: number, annotationId: number) => void;
  deselectAnnotation: () => void;
  getAnnotationMode: () => StylableSubtype | null;
  setAnnotationMode: (mode: StylableSubtype | null) => void;
  /** strongly typed – only sub-types we have defaults for */
  getToolDefaults: <S extends StylableSubtype>(subtype: S) => ToolDefaultsBySubtype[S];
  /** Partially patch a single tool’s defaults */
  setToolDefaults: <S extends StylableSubtype>(
    subtype: S,
    patch: Partial<ToolDefaultsBySubtype[S]>,
  ) => void;
  /** current palette – UI just reads this */
  getColorPresets: () => string[];
  /** append a swatch (deduped by RGBA) */
  addColorPreset: (color: string) => void;
  createAnnotation: (pageIndex: number, annotation: PdfAnnotationObject) => void;
  updateAnnotation: (
    pageIndex: number,
    annotationId: number,
    patch: Partial<PdfAnnotationObject>,
  ) => void;
  deleteAnnotation: (pageIndex: number, annotationId: number) => void;
  /** undo / redo */
  onStateChange: EventHook<AnnotationState>;
  onModeChange: EventHook<StylableSubtype | null>;
  onActiveToolChange: EventHook<ActiveTool>;
  commit: () => void;
}

export interface SelectedAnnotation {
  pageIndex: number;
  localId: number;
  annotation: PdfAnnotationObject;
}

export interface GetPageAnnotationsOptions {
  pageIndex: number;
}

export interface UpdateAnnotationColorOptions extends WebAlphaColor {
  pageIndex: number;
  annotationId: number;
}
