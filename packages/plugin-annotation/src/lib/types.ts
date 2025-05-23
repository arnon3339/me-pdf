import { BasePluginConfig } from '@embedpdf/core';
import { PdfAnnotationObject, PdfErrorReason, Rotation, Task } from '@embedpdf/models';

export interface AnnotationPluginConfig extends BasePluginConfig {}

export interface AnnotationCapability {
  getPageAnnotations: (
    options: GetPageAnnotationsOptions,
  ) => Task<PdfAnnotationObject[], PdfErrorReason>;
}

export interface GetPageAnnotationsOptions {
  pageIndex: number;
  scaleFactor?: number;
  rotation?: Rotation;
}
