import { BasePluginConfig, EventHook } from '@embedpdf/core';
import {
  PdfAnnotationObject,
  PdfErrorReason,
  Task,
  PdfAnnotationSubtype,
  WebAlphaColor,
} from '@embedpdf/models';

export interface BaseAnnotationDefaults extends WebAlphaColor {
  interaction: {
    mode: string;
    exclusive: boolean;
    cursor?: string;
  };
  textSelection: boolean;
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
  annotations: Record<number, PdfAnnotationObject[]>;
  selectedAnnotation: SelectedAnnotation | null;
  annotationMode: StylableSubtype | null;
  toolDefaults: ToolDefaultsBySubtype;
  colorPresets: string[];
}

export interface SelectedAnnotation {
  pageIndex: number;
  annotationId: number;
  annotation: PdfAnnotationObject;
}

export interface AnnotationPluginConfig extends BasePluginConfig {
  toolDefaults?: Partial<ToolDefaultsBySubtype>;
  colorPresets?: string[];
}

export interface AnnotationCapability {
  getPageAnnotations: (
    options: GetPageAnnotationsOptions,
  ) => Task<PdfAnnotationObject[], PdfErrorReason>;
  selectAnnotation: (pageIndex: number, annotationId: number) => void;
  deselectAnnotation: () => void;
  updateAnnotationColor: (options: WebAlphaColor) => Promise<boolean>;
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
  onStateChange: EventHook<AnnotationState>;
  onModeChange: EventHook<StylableSubtype | null>;
  onActiveToolChange: EventHook<ActiveTool>;
}

export interface GetPageAnnotationsOptions {
  pageIndex: number;
}

export interface UpdateAnnotationColorOptions extends WebAlphaColor {
  pageIndex: number;
  annotationId: number;
}
