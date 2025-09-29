import { BasePluginConfig } from '@embedpdf/core';
import { PdfErrorReason, Task } from '@embedpdf/models';
import type { ScrollBehavior } from '@embedpdf/plugin-scroll';

export interface ThumbnailPluginConfig extends BasePluginConfig {
  width?: number; // thumb width  (css px), default 120
  gap?: number; // vertical gap (css px), default 8
  buffer?: number; // extra rows above/below viewport, default 3
  labelHeight?: number; // reserved space under thumb     (default 16)
  autoScroll?: boolean; // auto scroll to selected page when page changes (default true)
  scrollBehavior?: ScrollBehavior;
  imagePadding?: number;
}

export interface ScrollToOptions {
  top: number;
  behavior?: ScrollBehavior;
}

export interface ThumbMeta {
  pageIndex: number;
  /** Inner bitmap size (excludes padding). */
  width: number;
  height: number;
  /** Total row height (padding*2 + image height + labelHeight). */
  wrapperHeight: number;
  /** Top offset of the entire row (including padding + label). */
  top: number;
  labelHeight: number;
  /** Padding applied around the image (px). */
  padding?: number;
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
