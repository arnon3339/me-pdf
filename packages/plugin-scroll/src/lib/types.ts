import { BasePluginConfig } from "@embedpdf/core";
import { PdfPageObject } from "@embedpdf/models";
import { ViewportMetrics } from "@embedpdf/plugin-viewport";

export enum ScrollStrategy {
  Vertical = 'vertical',
  Horizontal = 'horizontal'
}

export interface PageVisibilityMetrics {
  pageNumber: number;
  viewportX: number;
  viewportY: number;
  pageX: number;
  pageY: number;
  visibleWidth: number;
  visibleHeight: number;
  visiblePercentage: number;
}

export interface ScrollMetrics {
  currentPage: number;
  visiblePages: number[];
  pageVisibilityMetrics: PageVisibilityMetrics[];
  renderedPageIndexes: number[];
  scrollOffset: { x: number; y: number };
}

export interface VirtualItem {
  pageNumbers: number[];  // Can be multiple pages in case of spread
  pages: PdfPageObject[];
  index: number;         // Virtual index in the scroll list
  size: number;         // Height for vertical, width for horizontal
  offset: number;      // Position in the scroll direction
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
}

export interface ScrollCapability {
  onScroll(handler: (metrics: ScrollMetrics) => void): void;
  onPageChange(handler: (pageNumber: number) => void): void;
  onScrollReady(handler: () => void): void;
  scrollToPage(pageNumber: number, behavior?: ScrollBehavior): void;
  scrollToNextPage(behavior?: ScrollBehavior): void;
  scrollToPreviousPage(behavior?: ScrollBehavior): void;
  getMetrics(viewport?: ViewportMetrics): ScrollMetrics;
}