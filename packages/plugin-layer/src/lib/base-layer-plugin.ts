import { ILayerPlugin, LayerRenderOptions } from "./types";
import { PdfDocumentObject, PdfEngine, PdfPageObject } from "@embedpdf/models";
import { PluginRegistry } from "@embedpdf/core";

interface LayerPageCache<T = void> {
  page: PdfPageObject;
  container: HTMLElement;
  options: LayerRenderOptions;
  data: T;
  topic?: string; // Add topic for different rendering contexts
}

interface DocumentCache<T = void> {
  documentId: string;
  pages: Map<number, Map<string, LayerPageCache<T>>>; // Nested map for topic-specific caches
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
   * Update an existing render with new options
   */
  async updateRender(
    document: PdfDocumentObject,
    page: PdfPageObject,
    container: HTMLElement,
    options: LayerRenderOptions
  ): Promise<void> {
    // Default implementation just re-renders
    await this.render(document, page, container, options);
  }

  /**
   * Remove cache for a specific document, page, and topic
   */
  async removeCache(documentId: string, pageNumber: number, topic?: string, force?: boolean): Promise<void> {
    // Default implementation - individual layers can override to decide if they want to honor non-forced removal
    if (force !== false) {
      this.clearCache(documentId, pageNumber, topic);
    }
  }

  /**
   * Get complete cache entry for a specific page in a document
   */
  protected getPageCache(
    documentId: string, 
    pageNumber: number, 
    topic: string = 'default'
  ): LayerPageCache<TCacheData> | undefined {
    const docCache = this.documentCache.get(documentId);
    if (!docCache) return undefined;
    
    docCache.lastAccessed = Date.now();
    const pageCache = docCache.pages.get(pageNumber);
    
    if (!pageCache) return undefined;
    
    return pageCache.get(topic);
  }

  /**
   * Get just the cached data for a specific page in a document
   */
  protected getPageCacheData(
    documentId: string, 
    pageNumber: number,
    topic: string = 'default'
  ): TCacheData | undefined {
    return this.getPageCache(documentId, pageNumber, topic)?.data;
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
    const topic = options.topic || 'default';
    
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
    
    // Setup page map if it doesn't exist
    if (!docCache.pages.has(pageNumber)) {
      docCache.pages.set(pageNumber, new Map());
    }
    
    // Set cache for this topic
    const pageCache = docCache.pages.get(pageNumber)!;
    pageCache.set(topic, {
      page,
      container,
      options,
      data,
      topic
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
    return this.registry.getPlugin<T>(layerId) as T | undefined;
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
    const topic = options.topic || 'default';
    const cache = this.getPageCache(documentId, pageNumber, topic);
    if (!cache) return false;

    // Don't compare topic in options, as we've already used it to select the correct cache
    const { topic: _, ...optionsWithoutTopic } = options;
    const { topic: __, ...cacheOptionsWithoutTopic } = cache.options;

    return (
      cache.container === container &&
      JSON.stringify(optionsWithoutTopic) === JSON.stringify(cacheOptionsWithoutTopic)
    );
  }

  /**
   * Clear cache for a specific document, page, topic, or all documents
   */
  protected clearCache(documentId?: string, pageNumber?: number, topic?: string): void {
    if (documentId) {
      const docCache = this.documentCache.get(documentId);
      if (!docCache) return;
      
      if (pageNumber !== undefined) {
        const pageCache = docCache.pages.get(pageNumber);
        if (!pageCache) return;
        
        if (topic !== undefined) {
          pageCache.delete(topic);
        } else {
          docCache.pages.delete(pageNumber);
        }
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