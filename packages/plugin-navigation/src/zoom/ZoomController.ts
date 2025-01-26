import { IPDFCore } from '@cloudpdf/core';
import { NavigationState, ViewportMetrics, ZoomLevel } from '../types';

interface ZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  defaultZoomLevel?: ZoomLevel;
  zoomStep?: number;
}

interface IZoomControllerOptions {
  container: HTMLElement;
  state: NavigationState;
  core: IPDFCore;
  options: ZoomOptions;
}

export class ZoomController {
  private readonly minZoom: number;
  private readonly maxZoom: number;
  private readonly zoomStep: number;
  
  private container: HTMLElement;
  private state: NavigationState;
  private core: IPDFCore;
  private lastZoomCenter?: { x: number; y: number };
  private pinchStartDistance?: number;
  private resizeObserver!: ResizeObserver;
  private resizeTimeout: NodeJS.Timeout | null = null;
  
  // Add private fields for event listeners
  private boundWheelHandler!: (e: WheelEvent) => void;
  private boundTouchStartHandler!: (e: TouchEvent) => void;
  private boundTouchMoveHandler!: (e: TouchEvent) => void;
  private boundTouchEndHandler!: (e: TouchEvent) => void;

  constructor(options: IZoomControllerOptions) {
    this.container = options.container;
    this.state = options.state;
    this.minZoom = options.options.minZoom ?? 0.25;
    this.maxZoom = options.options.maxZoom ?? 10;
    this.zoomStep = options.options.zoomStep ?? 0.1;

    this.core = options.core;

    this.setupEventListeners();
    this.setupResizeObserver();
  }

  updateZoomLevel(zoomLevel?: ZoomLevel): number {
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
    const containerWidth = this.container.clientWidth - 64;
    const containerHeight = this.container.clientHeight - 64;

    // Find the widest and tallest page
    let maxDimensions = this.state.pages.reduce((max, page) => ({
      width: Math.max(max.width, page.page.size.width),
      height: Math.max(max.height, page.page.size.height)
    }), { width: 0, height: 0 });

    let zoom: number;
    switch (mode) {
      case 'fit-width':
        zoom = containerWidth / maxDimensions.width;
        break;
      case 'fit-page':
        // Choose the smaller ratio to ensure the whole page fits
        const widthRatio = containerWidth / maxDimensions.width;
        const heightRatio = containerHeight / maxDimensions.height;
        zoom = Math.min(widthRatio, heightRatio);
        break;
      case 'automatic':
        // Calculate fit-width ratio
        zoom = containerWidth / maxDimensions.width;
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

  public getViewportMetrics(): ViewportMetrics {
    const scrollTop = this.container.scrollTop;
    const viewportHeight = this.container.clientHeight;
    const viewportWidth = this.container.clientWidth;
    const scrollLeft = this.container.scrollLeft;
    const scrollWidth = this.container.scrollWidth;
    const scrollHeight = this.container.scrollHeight;
    
    return {
      scrollWidth,
      scrollHeight,
      scrollTop,
      scrollLeft,
      viewportHeight,
      viewportWidth,
      relativePosition: {
        x: this.container.scrollWidth <= viewportWidth ? 0 : scrollLeft / (scrollWidth - viewportWidth),
        y: this.container.scrollHeight <= viewportHeight ? 0 : scrollTop / (scrollHeight - viewportHeight)
      }
    };
  }

  public zoomTo(newZoomLevel: ZoomLevel, center?: { x: number; y: number }): void {
    const oldZoom = this.state.currentZoomLevel;
  
    // Store metrics before zoom
    const metrics = this.getViewportMetrics();
    this.lastZoomCenter = center;

    const newZoom = this.updateZoomLevel(newZoomLevel);

    // Emit zoom change event with all relevant data
    const zoomData = {
      oldZoom,
      newZoom,
      center,
      metrics
    };

    // Let subscribers handle their own zoom adjustments
    this.core.emit('zoom:change', zoomData);
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