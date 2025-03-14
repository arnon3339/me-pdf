import { BasePluginConfig } from "@embedpdf/core";
import { PdfPageObject, Rotation } from "@embedpdf/models";

export interface PageManagerPluginConfig extends BasePluginConfig {
  pageGap?: number;
  scale?: number;
  rotation?: Rotation;
  maxCanvasCache?: number; // Maximum number of canvas elements to keep in memory
}

export interface PageManagerCapability {
  onPagesChange(handler: (pages: PdfPageObject[][]) => void): void;
  onPageManagerInitialized(handler: (pages: PdfPageObject[][]) => void): void;
  getPages(): PdfPageObject[];
  getSpreadPages(): PdfPageObject[][];
  getPageGap(): number;
  createPageElement(page: PdfPageObject, pageNum: number): HTMLElement;
  getScale(): number;
  updateScale(scale: number): void;
  getRotation(): Rotation;
  updateRotation(rotation: Rotation): void;
  rotateForward(): void;
  rotateBackward(): void;
  updateVisiblePages(visiblePages: UpdateVisiblePages): void;
}

export interface UpdateVisiblePages {
  visiblePages: number[];
  currentPage: number;
  renderedPageIndexes: number[];
}