import { ZoomState } from '../types';
import Hammer from 'hammerjs';

// Helper constants and functions for Hammer input detection
const MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;
const SUPPORT_TOUCH = (typeof window !== "undefined") ? 
  ('ontouchstart' in window) || 
  (window.navigator.maxTouchPoints > 0) : 
  false;
const SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && 
  (typeof navigator !== "undefined" ? MOBILE_REGEX.test(navigator.userAgent) : false);

/**
 * Get the appropriate Hammer input class based on device capabilities
 * @returns The Hammer input class to use based on device support
 */
const getHammerInputClass = () => {
  if (SUPPORT_ONLY_TOUCH) {
    return Hammer.TouchInput;
  }
  if (!SUPPORT_TOUCH) {
    return Hammer.MouseInput;
  }
  return Hammer.TouchMouseInput;
};

interface PinchControllerOptions {
  innerDiv: HTMLElement;
  container: HTMLElement;
  state: ZoomState;
  onPinchEnd: (zoom?: number, center?: { x: number; y: number }) => void; // Updated to accept final zoom value
}

/**
 * PinchController handles pinch-to-zoom gestures using Hammer.js
 * It's separated from the main ZoomController to better encapsulate pinch gesture handling
 */
export class PinchController {
  private hammer!: HammerManager;
  private initialZoom?: number;
  private lastZoomCenter?: { x: number; y: number };
  private innerDiv: HTMLElement; // pdf-viewport-inner
  private scrollContainer: HTMLElement; // viewer-container

  /**
   * Creates a new pinch controller instance
   * @param options Configuration options for the pinch controller
   */
  constructor(private options: PinchControllerOptions) {
    this.innerDiv = this.options.innerDiv; // pdf-viewport-inner
    this.scrollContainer = this.options.container
    if (!this.scrollContainer) {
      throw new Error('PinchController requires a scroll container');
    }
    this.setupEventListeners();
  }

  /**
   * Updates the transform scale on the inner div during pinch operations
   * @param scale The relative scale factor to apply during the pinch gesture
   */
  private updateTransform(scale: number) {
    requestAnimationFrame(() => {
      if (!this.initialZoom) return;
      // Apply relative scale from 1, since --scale-factor already scales the content
      const relativeScale = scale; // Hammer.js scale is relative to pinch start
      this.innerDiv.style.transform = `scale(${relativeScale})`;
    });
  }

  /**
   * Sets up Hammer.js event listeners for pinch gestures
   * This configures pinch recognition and handlers for pinch events
   */
  private setupEventListeners(): void {
    const inputClass = getHammerInputClass();
    const { innerDiv } = this.options;

    this.hammer = new Hammer(innerDiv, {
      touchAction: 'pan-x pan-y',
      inputClass,
    });

    this.hammer.get('pinch').set({
      enable: true,
      pointers: 2,
      threshold: 0.1,
    });

    this.hammer.on('pinchstart', (e) => {
      this.initialZoom = this.options.state.currentZoomLevel;
      const scrollRect = this.scrollContainer.getBoundingClientRect();
      const centerX = e.center.x - scrollRect.left; // Relative to container
      const centerY = e.center.y - scrollRect.top;
      this.lastZoomCenter = { x: centerX, y: centerY };
    
      const innerRect = this.innerDiv.getBoundingClientRect();
      const innerCenterX = e.center.x - innerRect.left;
      const innerCenterY = e.center.y - innerRect.top;
      this.innerDiv.style.transformOrigin = `${innerCenterX}px ${innerCenterY}px`;
      if (e.srcEvent && e.srcEvent.cancelable) {
        e.srcEvent.preventDefault();
        e.srcEvent.stopPropagation();
      }
    });
    
    this.hammer.on('pinchmove', (e) => {
      if (this.initialZoom !== undefined) {
        this.updateTransform(e.scale);
        if (e.srcEvent && e.srcEvent.cancelable) {
          e.srcEvent.preventDefault();
          e.srcEvent.stopPropagation();
        }
      }
    });
    
    this.hammer.on('pinchend', (e) => {
      if (this.initialZoom !== undefined) {
        const finalZoom = this.initialZoom * e.scale;
        this.options.onPinchEnd(finalZoom, this.lastZoomCenter);
        this.innerDiv.style.transform = 'none';
        this.innerDiv.style.transformOrigin = '0 0';
        this.initialZoom = undefined;
        this.lastZoomCenter = undefined;
      }
    });
  }

  /**
   * Cleans up resources used by the pinch controller
   * This should be called when the controller is no longer needed
   */
  public destroy(): void {
    if (this.hammer) {
      this.hammer.destroy();
    }
  }
}

// Export to make TypeScript recognize this as a module
export default PinchController; 