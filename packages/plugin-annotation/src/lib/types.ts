import { BasePluginConfig, EventHook } from '@embedpdf/core';
import {
  PdfAlphaColor,
  PdfAnnotationObject,
  PdfErrorReason,
  Task,
  PdfAnnotationSubtype,
} from '@embedpdf/models';

interface BaseAnnotationDefaults {
  color: PdfAlphaColor;
}

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

export type Color = {
  red: number;
  green: number;
  blue: number;
};

export interface AnnotationState {
  annotations: Record<number, PdfAnnotationObject[]>;
  selectedAnnotation: SelectedAnnotation | null;
  annotationMode: PdfAnnotationSubtype | null;
  toolDefaults: Partial<ToolDefaultsBySubtype>;
  colorPresets: Color[];
}

export interface SelectedAnnotation {
  pageIndex: number;
  annotationId: number;
  annotation: PdfAnnotationObject;
}

export interface AnnotationPluginConfig extends BasePluginConfig {
  toolDefaults?: Partial<ToolDefaultsBySubtype>;
  colorPresets?: Color[];
}

export interface AnnotationCapability {
  getPageAnnotations: (
    options: GetPageAnnotationsOptions,
  ) => Task<PdfAnnotationObject[], PdfErrorReason>;
  selectAnnotation: (pageIndex: number, annotationId: number) => void;
  deselectAnnotation: () => void;
  updateAnnotationColor: (color: PdfAlphaColor) => Promise<boolean>;
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
  getColorPresets: () => Color[];
  /** append a swatch (deduped by RGBA) */
  addColorPreset: (color: Color) => void;
}

export interface GetPageAnnotationsOptions {
  pageIndex: number;
}

export interface UpdateAnnotationColorOptions {
  pageIndex: number;
  annotationId: number;
  color: PdfAlphaColor;
}
