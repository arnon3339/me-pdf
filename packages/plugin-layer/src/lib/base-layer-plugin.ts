import { ILayerPlugin, LayerRenderOptions } from "./types";
import { PdfDocumentObject, PdfEngine, PdfPageObject } from "@embedpdf/models";
import { PluginRegistry } from "@embedpdf/core";

interface LayerPageCache<T = void> {
  page: PdfPageObject;
  container: HTMLElement;
  options: LayerRenderOptions;
  data: T;
}

interface DocumentCache<T = void> {
  documentId: string;
  pages: Map<number, LayerPageCache<T>>;
  lastAccessed: number;
}

export abstract class BaseLayerPlugin<TConfig = unknown, TCacheData = void> implements ILayerPlugin<TConfig> {
  public abstract zIndex: number;
  protected documentCache: Map<string, DocumentCache<TCacheData>> = new Map();
  protected maxDocumentsInCache: number = 5; // Configurable limit

  constructor(
    public readonly id: string,
    protected registry: PluginRegistry,
    protected engine: PdfEngine
  ) {}

  abstract render(
    document: PdfDocumentObject,
    page: PdfPageObject,
    container: HTMLElement,
    options: LayerRenderOptions
  ): Promise<void>;

  /**
   * Get complete cache entry for a specific page in a document
   */
  protected getPageCache(documentId: string, pageNumber: number): LayerPageCache<TCacheData> | undefined {
    const docCache = this.documentCache.get(documentId);
    if (!docCache) return undefined;
    
    docCache.lastAccessed = Date.now();
    return docCache.pages.get(pageNumber);
  }

  /**
   * Get just the cached data for a specific page in a document
   */
  protected getPageCacheData(documentId: string, pageNumber: number): TCacheData | undefined {
    return this.getPageCache(documentId, pageNumber)?.data;
  }

  /**
   * Set cache for a specific page in a document
   */
  protected setPageCache(
    documentId: string,
    pageNumber: number,
    page: PdfPageObject,
    container: HTMLElement,
    options: LayerRenderOptions,
    data: TCacheData
  ): void {
    let docCache = this.documentCache.get(documentId);
    
    if (!docCache) {
      this.ensureCacheCapacity();
      docCache = {
        documentId,
        pages: new Map(),
        lastAccessed: Date.now()
      };
      this.documentCache.set(documentId, docCache);
    }

    docCache.lastAccessed = Date.now();
    docCache.pages.set(pageNumber, {
      page,
      container,
      options,
      data,
    });
  }

  /**
   * Ensure cache doesn't exceed maximum capacity by removing least recently accessed documents
   */
  private ensureCacheCapacity(): void {
    if (this.documentCache.size >= this.maxDocumentsInCache) {
      const documents = Array.from(this.documentCache.entries());
      documents.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      this.documentCache.delete(documents[0][0]); // Remove least recently accessed
    }
  }

  /**
   * Get another layer plugin instance by ID
   */
  protected getLayer<T extends ILayerPlugin>(layerId: string): T | undefined {
    return this.registry.getPlugin<T>(layerId);
  }

  /**
   * Check if the cache is still valid for the given parameters
   */
  protected isCacheValid(
    documentId: string,
    pageNumber: number,
    container: HTMLElement,
    options: LayerRenderOptions
  ): boolean {
    const cache = this.getPageCache(documentId, pageNumber);
    if (!cache) return false;

    return (
      cache.container === container &&
      JSON.stringify(cache.options) === JSON.stringify(options)
    );
  }

  /**
   * Clear cache for a specific document, page, or all documents
   */
  protected clearCache(documentId?: string, pageNumber?: number): void {
    if (documentId) {
      if (pageNumber !== undefined) {
        this.documentCache.get(documentId)?.pages.delete(pageNumber);
      } else {
        this.documentCache.delete(documentId);
      }
    } else {
      this.documentCache.clear();
    }
  }

  /**
   * Cleanup method
   */
  async destroy(): Promise<void> {
    this.documentCache.clear();
  }
} 