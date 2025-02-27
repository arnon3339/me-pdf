import { ViewportCapability, ViewportMetrics } from '@embedpdf/plugin-viewport';
import { PageManagerCapability } from '@embedpdf/plugin-page-manager';
import { ZoomLevel, ZoomChangeEvent, ZoomState } from '../types';

interface ZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
}

interface IZoomControllerOptions {
  viewport: ViewportCapability;
  pageManager: PageManagerCapability;
  options: ZoomOptions;
  state: ZoomState;
}

export class ZoomController {
  private readonly minZoom: number;
  private readonly maxZoom: number;
  private readonly zoomStep: number;
  
  private container: HTMLElement;
  private lastZoomCenter?: { x: number; y: number };
  private pinchStartDistance?: number;
  private resizeObserver!: ResizeObserver;
  private resizeTimeout: NodeJS.Timeout | null = null;

  private pageManager: PageManagerCapability;
  private viewport: ViewportCapability;
  private state: ZoomState;
  
  // Add private fields for event listeners
  private boundWheelHandler!: (e: WheelEvent) => void;
  private boundTouchStartHandler!: (e: TouchEvent) => void;
  private boundTouchMoveHandler!: (e: TouchEvent) => void;
  private boundTouchEndHandler!: (e: TouchEvent) => void;

  constructor(options: IZoomControllerOptions) {
    this.viewport = options.viewport;
    this.pageManager = options.pageManager;
    this.state = options.state;
    this.minZoom = options.options.minZoom ?? 0.25;
    this.maxZoom = options.options.maxZoom ?? 10;
    this.zoomStep = options.options.zoomStep ?? 0.1;
    this.container = this.viewport.getContainer();
    this.setupEventListeners();
    this.setupResizeObserver();
  }

  private updateZoomLevel(zoomLevel?: ZoomLevel): number {
    const newZoomLevel = zoomLevel ?? this.state.zoomLevel;

    let zoom: number;
    if (typeof newZoomLevel === 'number') {
      zoom = newZoomLevel;
    } else {
      zoom = this.calculateZoomLevel(newZoomLevel);
    }

    const clampedZoom = Math.min(Math.max(zoom, this.minZoom), this.maxZoom);
    this.state.currentZoomLevel = clampedZoom;
    this.container.style.setProperty('--scale-factor', `${clampedZoom}`);
    return clampedZoom;
  }

  private calculateZoomLevel(mode: 'automatic' | 'fit-page' | 'fit-width'): number {
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;

    // Get spread pages from page manager
    const spreadPages = this.pageManager.getSpreadPages();
    const pageGap = this.pageManager.getPageGap();

    if (!spreadPages.length) {
      return 1;
    }
    
    // Calculate max dimensions considering spreads
    let maxWidth = 0;
    let maxHeight = 0;
    
    spreadPages.forEach(spread => {
      const spreadWidth = spread.reduce((width, page, index) => {
        return width + page.size.width + (index > 0 ? pageGap : 0);
      }, 0);
      
      const spreadHeight = Math.max(...spread.map(page => page.size.height));
      
      maxWidth = Math.max(maxWidth, spreadWidth);
      maxHeight = Math.max(maxHeight, spreadHeight);
    });

    let zoom: number;
    switch (mode) {
      case 'fit-width':
        zoom = containerWidth / maxWidth;
        break;
      case 'fit-page':
        // Choose the smaller ratio to ensure the whole page fits
        const widthRatio = containerWidth / maxWidth;
        const heightRatio = containerHeight / maxHeight;
        zoom = Math.min(widthRatio, heightRatio);
        break;
      case 'automatic':
        // Calculate fit-width ratio
        zoom = containerWidth / maxWidth;
        // Cap at 1 if larger
        zoom = Math.min(zoom, 1);
        break;
    }

    // Clamp zoom level to min/max bounds
    return Math.min(Math.max(zoom, this.minZoom), this.maxZoom);
  }

  private setupEventListeners(): void {
    // Store bound event handlers
    this.boundWheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = this.container.getBoundingClientRect();
        const zoomCenter = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        
        const delta = -Math.sign(e.deltaY) * this.zoomStep;
        this.zoomBy(delta, zoomCenter);
      }
    };

    let initialTouches: Touch[] = [];
    
    this.boundTouchStartHandler = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialTouches = Array.from(e.touches);
        this.pinchStartDistance = this.getPinchDistance(e.touches);
      }
    };

    this.boundTouchMoveHandler = (e: TouchEvent) => {
      if (e.touches.length === 2 && this.pinchStartDistance) {
        e.preventDefault();
        const currentDistance = this.getPinchDistance(e.touches);
        const scale = currentDistance / this.pinchStartDistance;
        
        const center = this.getPinchCenter(e.touches);
        this.zoomTo(this.state.currentZoomLevel * scale, center);
      }
    };

    this.boundTouchEndHandler = () => {
      this.pinchStartDistance = undefined;
      initialTouches = [];
    };

    // Add event listeners using the bound handlers
    this.container.addEventListener('wheel', this.boundWheelHandler, { passive: false });
    this.container.addEventListener('touchstart', this.boundTouchStartHandler);
    this.container.addEventListener('touchmove', this.boundTouchMoveHandler);
    this.container.addEventListener('touchend', this.boundTouchEndHandler);
  }

  private getPinchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getPinchCenter(touches: TouchList): { x: number; y: number } {
    const rect = this.container.getBoundingClientRect();
    return {
      x: ((touches[0].clientX + touches[1].clientX) / 2) - rect.left,
      y: ((touches[0].clientY + touches[1].clientY) / 2) - rect.top
    };
  }

  public zoomTo(newZoomLevel: ZoomLevel, center?: { x: number; y: number }): ZoomChangeEvent {
    const oldZoom = this.state.currentZoomLevel;
  
    // Store metrics before zoom
    const oldMetrics = this.viewport.getMetrics();
    this.lastZoomCenter = center;

    const newZoom = this.updateZoomLevel(newZoomLevel);

    const newMetrics = this.viewport.getMetrics();

    this.adjustScrollPositionAfterZoom(oldMetrics, newMetrics, center);

    // Emit zoom change event with all relevant data
    const zoomData = {
      oldZoom,
      oldMetrics,
      newZoom,
      newMetrics,
      center,
    };

    // Let subscribers handle their own zoom adjustments
    return zoomData;
  }

  /**
   * Adjusts the scroll position after a zoom operation to maintain the relative position
   * or focus on the zoom center point
   */
  private adjustScrollPositionAfterZoom(
    oldMetrics: ViewportMetrics,
    newMetrics: ViewportMetrics,
    center?: { x: number; y: number }
  ): void {
    const container = this.viewport.getContainer();
    
    // Calculate new scroll position for vertical scrolling
    let newScrollTop;
    if (center) {
      // If zooming with a specific center point (e.g., mouse position)
      const relativeY = center.y / oldMetrics.clientHeight;
      const oldContentHeight = oldMetrics.scrollHeight;
      const newContentHeight = newMetrics.scrollHeight;
      
      // Calculate how much the content height has changed
      const heightChange = newContentHeight - oldContentHeight;
      
      // Adjust scroll position to keep the center point stable
      newScrollTop = oldMetrics.scrollTop + (heightChange * relativeY);
    } else {
      // If no center point, maintain the same relative scroll position
      newScrollTop = oldMetrics.relativePosition.y * 
        (newMetrics.scrollHeight - newMetrics.clientHeight);
    }
    
    // Calculate new scroll position for horizontal scrolling
    let newScrollLeft;
    if (center) {
      // If zooming with a specific center point
      const relativeX = center.x / oldMetrics.clientWidth;
      const oldContentWidth = oldMetrics.scrollWidth;
      const newContentWidth = newMetrics.scrollWidth;
      
      // Calculate how much the content width has changed
      const widthChange = newContentWidth - oldContentWidth;
      
      // Adjust scroll position to keep the center point stable
      newScrollLeft = oldMetrics.scrollLeft + (widthChange * relativeX);
    } else if (oldMetrics.scrollWidth <= oldMetrics.clientWidth && 
               newMetrics.scrollWidth > newMetrics.clientWidth) {
      // If the content was smaller than the container and is now larger, center it
      newScrollLeft = (newMetrics.scrollWidth - newMetrics.clientWidth) / 2;
    } else {
      // Otherwise maintain relative position
      newScrollLeft = oldMetrics.relativePosition.x * 
        (newMetrics.scrollWidth - newMetrics.clientWidth);
    }
    
    // Apply new scroll position
    container.scrollTop = newScrollTop;
    container.scrollLeft = newScrollLeft;
  }

  public zoomBy(delta: number, center?: { x: number; y: number }): void {
    this.zoomTo(this.state.currentZoomLevel + delta, center);
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      
      this.resizeTimeout = setTimeout(() => {
        if (typeof this.state.zoomLevel !== 'number') {
          this.zoomTo(this.state.zoomLevel);
        }
      }, 250); // 250ms debounce
    });

    this.resizeObserver.observe(this.container);
  }

  public destroy(): void {
    // Remove all event listeners
    this.container.removeEventListener('wheel', this.boundWheelHandler);
    this.container.removeEventListener('touchstart', this.boundTouchStartHandler);
    this.container.removeEventListener('touchmove', this.boundTouchMoveHandler);
    this.container.removeEventListener('touchend', this.boundTouchEndHandler);
    
    // Clean up resize observer
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeObserver.disconnect();
  }
} 