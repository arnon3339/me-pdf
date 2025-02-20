import { PdfPageObject } from "@embedpdf/models";
import { SpreadMetrics } from "@embedpdf/plugin-spread";
import { ViewportMetrics } from "@embedpdf/plugin-viewport";

export type ScrollStrategy = 'vertical' | 'horizontal' | 'wrapped';

export interface ScrollMetrics {
  currentPage: number;
  visiblePages: number[];
  scrollOffset: { x: number; y: number };
  totalHeight: number;
  totalWidth: number;
}

export interface VirtualItem {
  pageNumbers: number[];  // Can be multiple pages in case of spread
  index: number;         // Virtual index in the scroll list
  size: number;         // Height for vertical, width for horizontal
  offset: number;      // Position in the scroll direction
}

export interface ScrollStrategyInterface {
  initialize(container: HTMLElement): void;
  destroy(): void;
  updateLayout(spreadMetrics: SpreadMetrics): void;
  handleScroll(viewport: ViewportMetrics): void;
  getVirtualItems(): VirtualItem[];
  scrollToPage(pageNumber: number): void;
  calculateDimensions(spreadMetrics: SpreadMetrics): void;
} 