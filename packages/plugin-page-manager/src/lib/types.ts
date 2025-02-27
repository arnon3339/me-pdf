import { BasePluginConfig } from "@embedpdf/core";
import { PdfPageObject } from "@embedpdf/models";

export interface PageManagerPluginConfig extends BasePluginConfig {
  pageGap?: number;
}

export interface PageManagerCapability {
  onPagesChange(handler: (pages: PdfPageObject[][]) => void): void;
  onPageManagerInitialized(handler: (pages: PdfPageObject[][]) => void): void;
  getPages(): PdfPageObject[];
  getSpreadPages(): PdfPageObject[][];
  getPageGap(): number;
  createPageElement(page: PdfPageObject, pageNum: number): HTMLElement;
}

