import { BasePluginConfig } from '@embedpdf/core';

export interface PrintPluginConfig extends BasePluginConfig {
  defaultQuality?: PrintQuality;
  defaultIncludeAnnotations?: boolean;
  batchSize?: number;
}

export enum PrintQuality {
  Normal = 'normal',
  High = 'high',
}

export enum PageRangeType {
  Current = 'current',
  All = 'all',
  Custom = 'custom',
}

export interface PageRangeCurrent {
  type: PageRangeType.Current;
  currentPage: number;
}

export interface PageRangeAll {
  type: PageRangeType.All;
}

export interface PageRangeCustom {
  type: PageRangeType.Custom;
  pages: number[];
}

export type PageRange = PageRangeCurrent | PageRangeAll | PageRangeCustom;

export interface PrintOptions {
  pageRange: PageRange;
  includeAnnotations: boolean;
  quality: PrintQuality;
}

export interface PrintProgress {
  current: number;
  total: number;
  status: 'preparing' | 'rendering' | 'complete' | 'error';
  message?: string;
}

export interface PrintData {
  blobs: Blob[];
  options: PrintOptions;
  totalPages: number;
}

export interface ParsedPageRange {
  pages: number[];
  isValid: boolean;
  error?: string;
}

export interface PrintPageResult {
  pageIndex: number;
  blob: Blob;
}

export interface PrintCapability {
  preparePrint: (
    options: PrintOptions,
    onProgress?: (progress: PrintProgress) => void,
    onPageReady?: (result: PrintPageResult) => void,
  ) => Promise<void>;
  parsePageRange: (rangeString: string) => ParsedPageRange;
}
