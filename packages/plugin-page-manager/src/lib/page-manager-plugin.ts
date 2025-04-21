import { BasePlugin, IPlugin, PluginRegistry, SetDocumentAction } from "@embedpdf/core";
import { PdfDocumentObject, PdfPageObject, Rotation, transformSize } from "@embedpdf/models";
import { LoaderCapability, LoaderPlugin } from "@embedpdf/plugin-loader";
import { SpreadCapability, SpreadPlugin, SpreadMode } from "@embedpdf/plugin-spread";
//import { LayerCapability, LayerController, LayerPlugin } from "@embedpdf/plugin-layer";
import { PageManagerCapability, PageManagerPluginConfig, UpdateVisiblePages } from "./types";

// Define a structure that combines page element, controller, and rendering properties
/*
interface PageElementCache {
  element: HTMLElement;
  controller: LayerController | null;
  scale: number;
  rotation: Rotation;
  pageNum: number;
}*/

// Rotation helper functions - simplified with modular arithmetic
function getNextRotation(current: Rotation): Rotation {
  return ((current + 1) % 4) as Rotation;
}

function getPreviousRotation(current: Rotation): Rotation {
  return ((current + 3) % 4) as Rotation; // +3 is equivalent to -1 in modulo 4
}

export class PageManagerPlugin extends BasePlugin<PageManagerPluginConfig, PageManagerCapability> {
  private spread: SpreadCapability | null;
  //private layer: LayerCapability; 

  private pagesChangeHandlers: ((pages: PdfPageObject[][]) => void)[] = [];
  private pageManagerInitializedHandlers: ((pages: PdfPageObject[][]) => void)[] = [];
 
  private pdfDocument: PdfDocumentObject | null = null;
  private pages: PdfPageObject[] = [];
  private spreadPages: PdfPageObject[][] = [];
  private pageGap: number = 20;
  
  // Unified cache that contains both element and controller together with metadata
  //private pageCache: Map<number, PageElementCache> = new Map();
  
  private rotation: Rotation = Rotation.Degree0;
  private scale: number = 1;
  private visiblePages: number[] = [];
  private currentPage: number = 0;
  private renderedPageIndexes: number[] = [];
  // Maximum number of canvas elements to keep in memory
  private maxCanvasCache: number = 50; // This could be configurable

  constructor(
    public readonly id: string,
    registry: PluginRegistry,
  ) {
    super(id, registry);
    const spreadPlugin = registry.getPlugin<SpreadPlugin>('spread');
    this.spread = spreadPlugin ? spreadPlugin.provides() : null;
    //this.layer = this.registry.getPlugin<LayerPlugin>('layer')!.provides();

    // Listen for document loading
    this.coreStore.onAction('SET_DOCUMENT', this.handleDocumentLoaded.bind(this));
    if (this.spread) {
      this.spread.onSpreadChange(this.handleSpreadChange.bind(this));
    }
  }

  protected buildCapability(): PageManagerCapability {
    return {
      onPagesChange: (handler) => this.pagesChangeHandlers.push(handler),
      onPageManagerInitialized: (handler) => this.pageManagerInitializedHandlers.push(handler),
      getPages: () => this.pages,
      getSpreadPages: () => this.spreadPages,
      getPageGap: () => this.pageGap,
      //createPageElement: this.createPageElement.bind(this),
      getScale: () => this.scale,
      updateScale: this.updateScale.bind(this),
      getRotation: () => this.rotation,
      updateRotation: this.updateRotation.bind(this),
      rotateForward: this.rotateForward.bind(this),
      rotateBackward: this.rotateBackward.bind(this),
      updateVisiblePages: this.updateVisiblePages.bind(this)
    };
  }

  async initialize(config: PageManagerPluginConfig): Promise<void> {
    if (config.pageGap !== undefined) {
      this.pageGap = config.pageGap;
    }

    if (config.scale !== undefined) {
      this.scale = config.scale;
    }

    if (config.rotation !== undefined) {
      this.rotation = config.rotation;
    }

    if (config.maxCanvasCache !== undefined) {
      this.maxCanvasCache = config.maxCanvasCache;
    }
  }

  updateVisiblePages({ visiblePages, currentPage, renderedPageIndexes }: UpdateVisiblePages): void {
    this.visiblePages = visiblePages;
    this.currentPage = currentPage;
    this.renderedPageIndexes = renderedPageIndexes;

    // When visibility changes, check if we need to clear cache for non-visible pages
    this.manageLayerCache();
  }

  updateScale(scale: number): void {
    if (this.scale === scale) return;
    
    this.scale = scale;
    
    // Update all rendered pages in order of visibility
    this.updateRenderedPages();
  }

  rotateForward(): void {
    this.updateRotation(getNextRotation(this.rotation));
  }

  rotateBackward(): void {
    this.updateRotation(getPreviousRotation(this.rotation));
  }

  updateRotation(rotation: Rotation): void {
    if (this.rotation === rotation) return;
    
    this.rotation = rotation;
    
    // Update the spreadPages as dimensions change with rotation
    if (this.pdfDocument) {
      // We need to recreate spreadPages with rotated dimensions
      this.updateSpreadPages();
      // Notify that pages have changed so scroller can rerender
      this.notifyPagesChange();
    }
  }

  private getSpreadPages(pages: PdfPageObject[]): PdfPageObject[][] {
    if (this.spread) {
      return this.spread.getSpreadPagesObjects(pages);
    } else {
      return pages.map(page => [page]);
    }
  }
  /**
   * Apply transformSize to each page and create spread pages with transformed dimensions
   */
  private updateSpreadPages(): void {
    if (!this.pdfDocument || !this.pages.length) return;
    
    const transformedPages = this.pages.map(page => {
      const transformedPage = { ...page };
      const newSize = transformSize(page.size, this.rotation, 1);
      transformedPage.size = newSize;
      return transformedPage;
    });
    
    this.spreadPages = this.getSpreadPages(transformedPages);
  }

  /**
   * Updates all rendered pages with current scale/rotation,
   * prioritizing the most visible page first
   */
  private updateRenderedPages(): void {
    if (!this.renderedPageIndexes.length) return;
    
    // Sort rendered indexes by proximity to current page for priority updating
    const sortedIndexes = [...this.renderedPageIndexes].sort((a, b) => {
      const distA = Math.abs(a - this.currentPage);
      const distB = Math.abs(b - this.currentPage);
      return distA - distB;
    });
    
    // Update each page's layer controller
    for (const pageIndex of sortedIndexes) {
      // We need to adjust for 1-indexed page numbers in the cache
      const pageNum = pageIndex + 1;

      /*
      const cached = this.pageCache.get(pageNum);
      
      if (cached?.controller) {
        // Update cached metadata
        cached.scale = this.scale;
        cached.rotation = this.rotation;
        
        // Update controller with new properties
        cached.controller.update({
          scale: this.scale,
          rotation: this.rotation
        }).catch(error => {
          console.error(`Error updating page ${pageIndex}:`, error);
        });
      }
      */
    }
  }
  
  /**
   * Manage the layer cache by removing cache for pages that are no longer needed
   */
  private manageLayerCache(): void {
    if (this.renderedPageIndexes.length <= this.maxCanvasCache) {
      return; // No need to clear cache if under limit
    }
    
    // Get pages that are rendered but not currently visible
    const nonVisibleRendered = this.renderedPageIndexes.filter(
      pageIndex => !this.visiblePages.includes(pageIndex)
    );
    
    // Sort by distance from current page (furthest first)
    nonVisibleRendered.sort((a, b) => {
      const distA = Math.abs(a - this.currentPage);
      const distB = Math.abs(b - this.currentPage);
      return distB - distA; // Descending order - furthest first
    });
    
    // Calculate how many pages we need to clear
    const pagesToClear = this.renderedPageIndexes.length - this.maxCanvasCache;
    
    // Clear cache for the furthest non-visible pages
    for (let i = 0; i < Math.min(pagesToClear, nonVisibleRendered.length); i++) {
      const pageIndex = nonVisibleRendered[i];
      const pageNum = pageIndex + 1; // Adjust for 1-indexed page numbers
      /*
      const cached = this.pageCache.get(pageNum);
      
      if (cached?.controller) {
        cached.controller.removeCache().catch(error => {
          console.error(`Error removing cache for page ${pageIndex}:`, error);
        });
      }*/
    }
  }

  createPageElement(page: PdfPageObject, pageNum: number) {
    // Check if we already have a cached element for this page
    /*
    const cached = this.pageCache.get(pageNum);
    
    // If we have a cached version with current scale and rotation, reuse it
    if (cached && cached.scale === this.scale && cached.rotation === this.rotation) {
      return cached.element;
    }
    
    // If we have a cached version but with different scale/rotation, update it
    if (cached) {
      console.log(`Updating cached page ${pageNum} from scale=${cached.scale}/rotation=${cached.rotation} to scale=${this.scale}/rotation=${this.rotation}`);
      
      // If we have a controller, update it
      if (cached.controller) {
        cached.controller.update({
          scale: this.scale,
          rotation: this.rotation
        }).catch(error => {
          console.error(`Error updating page ${pageNum}:`, error);
        });
      } else {
        // If controller is missing (should not happen normally), re-render
        this.renderPage(page, pageNum, cached.element);
      }
      
      // Update cached metadata
      cached.scale = this.scale;
      cached.rotation = this.rotation;
      
      return cached.element;
    }
    
    // Otherwise, create a new element
    const pageElement = document.createElement('div');
    
    pageElement.dataset.pageNumber = pageNum.toString();
    pageElement.style.backgroundColor = '#ffffff';
    pageElement.style.display = 'flex';
    pageElement.style.alignItems = 'center';
    pageElement.style.justifyContent = 'center';
    
    // Create new cache entry (controller will be set by renderPage)
    const cacheEntry: PageElementCache = {
      element: pageElement,
      controller: null,
      scale: this.scale,
      rotation: this.rotation,
      pageNum: pageNum
    };
    
    // Cache the element
    this.pageCache.set(pageNum, cacheEntry);
    
    // Render the page and store the layer controller
    this.renderPage(page, pageNum, pageElement);
    
    return pageElement;
    */
  }
  
  /**
   * Helper method to render a page and update its controller in the cache
   */
  private renderPage(page: PdfPageObject, pageNum: number, element: HTMLElement): void {
    if (!this.pdfDocument) {
      console.error('Cannot render page: No PDF document loaded');
      return;
    }
    
    const pageIndex = pageNum - 1; // Convert to 0-indexed for the render method
    
    /*
    this.layer.render(this.pdfDocument, pageIndex, element, {
      scale: this.scale,
      rotation: this.rotation,
      topic: 'page-manager'
    }).then(controller => {
      // Update the controller in the cache
      const cached = this.pageCache.get(pageNum);
      if (cached) {
        cached.controller = controller;
      }
    }).catch(error => {
      console.error(`Error rendering page ${pageNum}:`, error);
    });
    */
  }

  private handleDocumentLoaded(action: SetDocumentAction): void {
    this.pdfDocument = action.payload;
    this.pages = action.payload.pages;
    
    // Apply transformSize to pages before creating spread pages
    this.updateSpreadPages();
    this.notifyPageManagerInitialized();
  }

  private handleSpreadChange(_spreadMode: SpreadMode): void {
    // Apply transformSize to pages again when spread mode changes
    this.updateSpreadPages();
    this.notifyPagesChange();
  }

  private notifyPagesChange(): void {
    this.pagesChangeHandlers.forEach(handler => handler(this.spreadPages));
  }

  private notifyPageManagerInitialized(): void {
    this.pageManagerInitializedHandlers.forEach(handler => handler(this.spreadPages));
  }

  async destroy(): Promise<void> {
    /*
    // Clean up all layer controllers
    for (const [pageNum, cached] of this.pageCache.entries()) {
      if (cached.controller) {
        try {
          await cached.controller.removeCache(true); // Force clear all cache
        } catch (error) {
          console.error(`Error cleaning up page ${pageNum}:`, error);
        }
      }
    }
    
    this.pageCache.clear();
    */
  }
}