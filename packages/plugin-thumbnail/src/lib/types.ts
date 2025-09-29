import { BasePluginConfig } from '@embedpdf/core';
import { PdfErrorReason, Task } from '@embedpdf/models';

export interface ThumbnailPluginConfig extends BasePluginConfig {
  width?: number; // thumb width  (css px), default 120
  gap?: number; // vertical gap (css px), default 8
  buffer?: number; // extra rows above/below viewport, default 3
  labelHeight?: number; // reserved space under thumb     (default 16)
  autoScroll?: boolean; // auto scroll to selected page when page changes (default true)
}

export interface ThumbMeta {
  pageIndex: number;
  width: number; // thumbnail width
  height: number; // bitmap height   (thumb only)
  wrapperHeight: number; // bitmap + labelHeight
  top: number; // offset from top of whole list
  labelHeight: number;
}

export interface WindowState {
  start: number; // first index in DOM
  end: number; // last index in DOM (inclusive)
  items: ThumbMeta[]; // meta for the indices above
  totalHeight: number; // full scroll height
}

export interface ThumbnailCapability {
  scrollToThumb(pageIdx: number): void;
  /** lazily render one thumb */
  renderThumb(pageIdx: number, dpr: number): Task<Blob, PdfErrorReason>;
}
