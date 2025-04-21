import { BasePluginConfig, Emitter, EventHook } from "@embedpdf/core";
import { PdfPageObject } from "@embedpdf/models";
import { ViewportMetrics } from "@embedpdf/plugin-viewport";
import { VirtualItem } from "./types/virtual-item";

export interface ScrollState extends ScrollMetrics {
  virtualItems: VirtualItem[];
  totalContentSize: { width: number; height: number };
  desiredScrollPosition: { x: number; y: number };
  strategy: ScrollStrategy;
  pageGap: number;
}

export enum ScrollStrategy {
  Vertical = 'vertical',
  Horizontal = 'horizontal'
}

export interface PageVisibilityMetrics {
  pageNumber: number;
  viewportX: number;
  viewportY: number;
  visiblePercentage: number;
  original: {
    pageX: number;
    pageY: number;
    visibleWidth: number;
    visibleHeight: number;
  };
  scaled: {
    pageX: number;
    pageY: number;
    visibleWidth: number;
    visibleHeight: number;
  };
}

export interface ScrollMetrics {
  currentPage: number;
  visiblePages: number[];
  pageVisibilityMetrics: PageVisibilityMetrics[];
  renderedPageIndexes: number[];
  scrollOffset: { x: number; y: number };
  topPadding: number;
  bottomPadding: number;
}

export interface ScrollStrategyInterface {
  initialize(container: HTMLElement, innerDiv: HTMLElement): void;
  destroy(): void;
  updateLayout(viewport: ViewportMetrics, pdfPageObject: PdfPageObject[][]): void;
  handleScroll(viewport: ViewportMetrics): void;
  getVirtualItems(): VirtualItem[];
  scrollToPage(pageNumber: number, behavior?: ScrollBehavior): void;
  calculateDimensions(pdfPageObject: PdfPageObject[][]): void;
} 

export interface ScrollPluginConfig extends BasePluginConfig {
  strategy?: ScrollStrategy;
  initialPage?: number;
  bufferSize?: number;
  pageGap?: number;
}

export type LayoutChangePayload =
  Pick<ScrollState, 'virtualItems' | 'totalContentSize'>;

export interface ScrollCapability {
  onStateChange: EventHook<ScrollState>;
  onScroll      : EventHook<ScrollMetrics>;
  onPageChange  : EventHook<number>;
  onLayoutChange: EventHook<LayoutChangePayload>;
  scrollToPage(pageNumber: number, behavior?: ScrollBehavior): void;
  scrollToNextPage(behavior?: ScrollBehavior): void;
  scrollToPreviousPage(behavior?: ScrollBehavior): void;
  getMetrics(viewport?: ViewportMetrics): ScrollMetrics;
  getLayout(): LayoutChangePayload;
  getState(): ScrollState;
}