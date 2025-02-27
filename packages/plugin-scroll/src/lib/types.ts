import { BasePluginConfig } from "@embedpdf/core";
import { PdfPageObject } from "@embedpdf/models";
import { ViewportMetrics } from "@embedpdf/plugin-viewport";

export type ScrollStrategy = 'vertical' | 'horizontal' | 'wrapped';

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
  scrollOffset: { x: number; y: number };
  totalHeight: number;
  totalWidth: number;
}

export interface VirtualItem {
  pageNumbers: number[];  // Can be multiple pages in case of spread
  pages: PdfPageObject[];
  index: number;         // Virtual index in the scroll list
  size: number;         // Height for vertical, width for horizontal
  offset: number;      // Position in the scroll direction
}

export interface ScrollStrategyInterface {
  initialize(container: HTMLElement): void;
  destroy(): void;
  updateLayout(viewport: ViewportMetrics, pdfPageObject: PdfPageObject[][]): void;
  handleScroll(viewport: ViewportMetrics): void;
  getVirtualItems(): VirtualItem[];
  scrollToPage(pageNumber: number): void;
  calculateDimensions(pdfPageObject: PdfPageObject[][]): void;
} 

export interface ScrollPluginConfig extends BasePluginConfig {
  strategy?: ScrollStrategy;
}

export interface ScrollCapability {
  onScroll(handler: (metrics: ScrollMetrics) => void): void;
  scrollToPage(pageNumber: number): void;
  //getCurrentMetrics(): ScrollMetrics;
}