import { BasePluginConfig, EventHook } from '@embedpdf/core';
import { PdfAnnotationObject, PdfErrorReason, Task } from '@embedpdf/models';

export interface AnnotationState {
  annotations: Record<number, PdfAnnotationObject[]>;
}

export interface AnnotationPluginConfig extends BasePluginConfig {}

export interface AnnotationCapability {
  getPageAnnotations: (
    options: GetPageAnnotationsOptions,
  ) => Task<PdfAnnotationObject[], PdfErrorReason>;
  onStateChange: EventHook<AnnotationState>;
}

export interface GetPageAnnotationsOptions {
  pageIndex: number;
}
