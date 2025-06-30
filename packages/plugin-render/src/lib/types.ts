import { BasePluginConfig } from '@embedpdf/core';
import { ImageConversionTypes, PdfErrorReason, Rect, Rotation, Task } from '@embedpdf/models';

export interface RenderPluginConfig extends BasePluginConfig {}

export interface RenderPageRectOptions {
  pageIndex: number;
  scaleFactor?: number;
  rotation?: Rotation;
  dpr?: number;
  rect: Rect;
  options?: {
    withAnnotations: boolean;
  };
  imageType?: ImageConversionTypes;
}

export interface RenderPageOptions {
  pageIndex: number;
  scaleFactor?: number;
  dpr?: number;
  rotation?: Rotation;
  options?: {
    withAnnotations: boolean;
  };
  imageType?: ImageConversionTypes;
}

export interface RenderCapability {
  renderPage: (options: RenderPageOptions) => Task<Blob, PdfErrorReason>;
  renderPageRect: (options: RenderPageRectOptions) => Task<Blob, PdfErrorReason>;
}
