import { IPDFCore } from '@cloudpdf/core';
import { NavigationState, ViewportMetrics } from '../types';

interface ZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  defaultZoom?: number;
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

    this.container.style.setProperty('--scale-factor', `${this.state.zoomLevel}`);
    this.core = options.core;

    this.setupEventListeners();
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
        this.zoomTo(this.state.zoomLevel * scale, center);
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

  public zoomTo(newZoom: number, center?: { x: number; y: number }): void {
    const oldZoom = this.state.zoomLevel;
    const clampedZoom = Math.min(Math.max(newZoom, this.minZoom), this.maxZoom);
    
    if (clampedZoom === oldZoom) return;

    // Store metrics before zoom
    const metrics = this.getViewportMetrics();
    this.lastZoomCenter = center;

    // Update zoom state
    this.state.zoomLevel = clampedZoom;
    this.container.style.setProperty('--scale-factor', `${clampedZoom}`);

    // Emit zoom change event with all relevant data
    const zoomData = {
      oldZoom,
      newZoom: clampedZoom,
      center,
      metrics
    };

    // Let subscribers handle their own zoom adjustments
    this.core.emit('zoom:change', zoomData);
  }

  public zoomBy(delta: number, center?: { x: number; y: number }): void {
    this.zoomTo(this.state.zoomLevel + delta, center);
  }

  public destroy(): void {
    // Remove all event listeners
    this.container.removeEventListener('wheel', this.boundWheelHandler);
    this.container.removeEventListener('touchstart', this.boundTouchStartHandler);
    this.container.removeEventListener('touchmove', this.boundTouchMoveHandler);
    this.container.removeEventListener('touchend', this.boundTouchEndHandler);
  }
} 