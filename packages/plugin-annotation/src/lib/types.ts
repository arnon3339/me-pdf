import { BasePluginConfig, EventHook } from '@embedpdf/core';
import { PdfAlphaColor, PdfAnnotationObject, PdfErrorReason, Task } from '@embedpdf/models';

export interface AnnotationState {
  annotations: Record<number, PdfAnnotationObject[]>;
  selectedAnnotation: SelectedAnnotation | null;
  editMode: boolean;
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
  setEditMode: (enabled: boolean) => void;
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
