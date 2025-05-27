import { BasePlugin, PluginRegistry } from '@embedpdf/core';
import { RenderCapability, RenderPlugin } from '@embedpdf/plugin-render';

import {
  PageRangeType,
  ParsedPageRange,
  PrintOptions,
  PrintPageResult,
  PrintPluginConfig,
  PrintProgress,
  PrintQuality,
} from './types';
import { PrintCapability } from './types';
import { Rotation } from '@embedpdf/models';

export class PrintPlugin extends BasePlugin<PrintPluginConfig, PrintCapability> {
  static readonly id = 'print' as const;

  private readonly renderCapability: RenderCapability;
  private readonly config: PrintPluginConfig;

  constructor(id: string, registry: PluginRegistry, config: PrintPluginConfig) {
    super(id, registry);

    this.config = config;
    this.renderCapability = this.registry.getPlugin<RenderPlugin>(RenderPlugin.id)?.provides()!;
  }

  async initialize(config: PrintPluginConfig): Promise<void> {
    console.log('initialize', config);
  }

  protected buildCapability(): PrintCapability {
    return {
      preparePrint: this.preparePrint.bind(this),
      parsePageRange: this.parsePageRange.bind(this),
    };
  }

  private async preparePrint(
    options: PrintOptions,
    onProgress?: (progress: PrintProgress) => void,
    onPageReady?: (result: PrintPageResult) => void,
  ): Promise<void> {
    const coreState = this.coreState.core;

    if (!coreState.document) {
      throw new Error('No document loaded');
    }

    const pagesToPrint = this.getPagesToPrint(options, coreState.document.pages.length);
    const totalPages = pagesToPrint.length;
    const batchSize = this.config?.batchSize || 3; // Render 3 pages concurrently by default

    onProgress?.({
      current: 0,
      total: totalPages,
      status: 'preparing',
      message: `Preparing to render ${totalPages} page${totalPages !== 1 ? 's' : ''}...`,
    });

    const scaleFactor = this.getScaleFactor(options.quality);
    const dpr = 1;

    // Process pages in batches to avoid memory issues
    for (let batchStart = 0; batchStart < pagesToPrint.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, pagesToPrint.length);
      const batch = pagesToPrint.slice(batchStart, batchEnd);

      // Render batch concurrently
      const batchPromises = batch.map(async (pageIndex, batchIndex) => {
        const overallIndex = batchStart + batchIndex;

        onProgress?.({
          current: overallIndex,
          total: totalPages,
          status: 'rendering',
          message: `Rendering page ${pageIndex + 1}...`,
        });

        const blob = await this.renderPage(pageIndex, scaleFactor, dpr, options.includeAnnotations);

        // Send page ready immediately after rendering
        onPageReady?.({
          pageIndex,
          blob,
        });

        return;
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);
    }

    onProgress?.({
      current: totalPages,
      total: totalPages,
      status: 'complete',
      message: 'All pages rendered successfully',
    });
  }

  private async renderPage(
    pageIndex: number,
    scaleFactor: number,
    dpr: number,
    withAnnotations: boolean,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const renderTask = this.renderCapability.renderPage({
        pageIndex,
        scaleFactor,
        dpr,
        rotation: Rotation.Degree0,
        options: {
          withAnnotations,
        },
      });

      renderTask.wait(
        (blob) => resolve(blob),
        (error) =>
          reject(
            new Error(
              `Failed to render page ${pageIndex + 1}: ${error.reason.message || 'Unknown error'}`,
            ),
          ),
      );
    });
  }

  private getScaleFactor(quality: PrintQuality): number {
    switch (quality) {
      case PrintQuality.High:
        return 1.5; // Higher resolution for better print quality
      case PrintQuality.Normal:
      default:
        return 1; // Standard print resolution
    }
  }

  private getPagesToPrint(options: PrintOptions, totalPages: number): number[] {
    const { pageRange } = options;

    switch (pageRange.type) {
      case PageRangeType.Current:
        return pageRange.currentPage !== undefined ? [pageRange.currentPage] : [0];

      case PageRangeType.All:
        return Array.from({ length: totalPages }, (_, i) => i);

      case PageRangeType.Custom:
        if (!pageRange.pages) return [0];
        return pageRange.pages
          .filter((page) => page >= 0 && page < totalPages)
          .sort((a, b) => a - b);

      default:
        return [0];
    }
  }

  private parsePageRange(rangeString: string): ParsedPageRange {
    try {
      const totalPages = this.coreState.core.document?.pages.length || 0;
      const pages: number[] = [];
      const parts = rangeString.split(',').map((s) => s.trim());

      for (const part of parts) {
        if (part.includes('-')) {
          // Handle range like "5-10"
          const [start, end] = part.split('-').map((s) => parseInt(s.trim()));

          if (isNaN(start) || isNaN(end)) {
            return { pages: [], isValid: false, error: `Invalid range: ${part}` };
          }

          if (start > end) {
            return { pages: [], isValid: false, error: `Invalid range: ${part} (start > end)` };
          }

          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= totalPages) {
              pages.push(i - 1); // Convert to 0-based index
            }
          }
        } else {
          // Handle single page
          const pageNum = parseInt(part);

          if (isNaN(pageNum)) {
            return { pages: [], isValid: false, error: `Invalid page number: ${part}` };
          }

          if (pageNum >= 1 && pageNum <= totalPages) {
            pages.push(pageNum - 1); // Convert to 0-based index
          }
        }
      }

      // Remove duplicates and sort
      const uniquePages = [...new Set(pages)].sort((a, b) => a - b);

      return {
        pages: uniquePages,
        isValid: true,
      };
    } catch (error) {
      return {
        pages: [],
        isValid: false,
        error: `Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
