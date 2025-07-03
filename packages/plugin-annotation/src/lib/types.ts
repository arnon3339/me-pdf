import { BasePluginConfig, EventHook } from '@embedpdf/core';
import {
  PdfAnnotationObject,
  PdfErrorReason,
  Task,
  PdfAnnotationSubtype,
  WebAlphaColor,
} from '@embedpdf/models';

interface BaseAnnotationDefaults extends WebAlphaColor {}

interface HighlightDefaults extends BaseAnnotationDefaults {
  name: 'Highlight';
}

interface UnderlineDefaults extends BaseAnnotationDefaults {
  name: 'Underline';
}

interface StrikeoutDefaults extends BaseAnnotationDefaults {
  name: 'Strikeout';
}

interface SquigglyDefaults extends BaseAnnotationDefaults {
  name: 'Squiggly';
}

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

export interface AnnotationState {
  annotations: Record<number, PdfAnnotationObject[]>;
  selectedAnnotation: SelectedAnnotation | null;
  annotationMode: PdfAnnotationSubtype | null;
  toolDefaults: Partial<ToolDefaultsBySubtype>;
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
  setAnnotationMode: (mode: PdfAnnotationSubtype | null) => void;
  onStateChange: EventHook<AnnotationState>;
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
}

export interface GetPageAnnotationsOptions {
  pageIndex: number;
}

export interface UpdateAnnotationColorOptions extends WebAlphaColor {
  pageIndex: number;
  annotationId: number;
}
