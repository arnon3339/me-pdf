import { BasePluginConfig, EventHook } from '@embedpdf/core';
import {
  PdfAlphaColor,
  PdfAnnotationObject,
  PdfErrorReason,
  Task,
  PdfAnnotationSubtype,
} from '@embedpdf/models';

export interface AnnotationState {
  annotations: Record<number, PdfAnnotationObject[]>;
  selectedAnnotation: SelectedAnnotation | null;
  annotationMode: PdfAnnotationSubtype | null;
}

export interface SelectedAnnotation {
  pageIndex: number;
  annotationId: number;
  annotation: PdfAnnotationObject;
}

export interface AnnotationPluginConfig extends BasePluginConfig {}

export interface AnnotationCapability {
  getPageAnnotations: (
    options: GetPageAnnotationsOptions,
  ) => Task<PdfAnnotationObject[], PdfErrorReason>;
  selectAnnotation: (pageIndex: number, annotationId: number) => void;
  deselectAnnotation: () => void;
  updateAnnotationColor: (color: PdfAlphaColor) => Promise<boolean>;
  setAnnotationMode: (mode: PdfAnnotationSubtype | null) => void;
  onStateChange: EventHook<AnnotationState>;
}

export interface GetPageAnnotationsOptions {
  pageIndex: number;
}

export interface UpdateAnnotationColorOptions {
  pageIndex: number;
  annotationId: number;
  color: PdfAlphaColor;
}
