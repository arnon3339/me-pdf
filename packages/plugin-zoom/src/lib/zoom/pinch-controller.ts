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
  container: HTMLElement;
  state: ZoomState;
  onZoomChange: (zoom: number, center?: { x: number; y: number }) => void;
  onPinchEnd: (zoom?: number) => void; // Updated to accept final zoom value
}

/**
 * PinchController handles pinch-to-zoom gestures using Hammer.js
 * It's separated from the main ZoomController to better encapsulate pinch gesture handling
 */
export class PinchController {
  private hammer!: HammerManager;
  private initialZoom?: number;
  private lastZoomCenter?: { x: number; y: number };
  private latestZoom?: number; // Added to track the latest zoom level
  
  constructor(private options: PinchControllerOptions) {
    this.setupEventListeners();
  }

  /**
   * Set up Hammer.js event listeners for pinch gestures
   */
  private setupEventListeners(): void {
    const inputClass = getHammerInputClass();
    const { container } = this.options;

    // Initialize Hammer.js on the container
    this.hammer = new Hammer(container, {
      touchAction: 'pan-x pan-y',  // Allow normal scrolling by default
      inputClass     // Use the appropriate input class for the device
    });
  
    // Enable pinch gesture and require 2 fingers
    this.hammer.get('pinch').set({ 
      enable: true, 
      pointers: 2,
      threshold: 0.1  // Make pinch detection more sensitive
    });
  
    // Pinch start: Store initial zoom and block default behavior
    this.hammer.on('pinchstart', (e) => {
      this.initialZoom = this.options.state.currentZoomLevel;
      
      // Get the center of the pinch in container coordinates
      const rect = container.getBoundingClientRect();
      this.lastZoomCenter = {
        x: e.center.x - rect.left,
        y: e.center.y - rect.top
      };
      
      // Prevent default behavior only when pinching
      if (e.srcEvent && e.srcEvent.cancelable) {
        e.srcEvent.preventDefault();
        e.srcEvent.stopPropagation();
      }
    });
  
    // Pinch move: Update zoom level without scrolling
    this.hammer.on('pinchmove', (e) => {
      if (this.initialZoom !== undefined) {
        const newZoom = this.initialZoom * e.scale;
        // Store the latest zoom value
        this.latestZoom = newZoom;
        // Use the callback to handle zoom changes during pinch
        this.options.onZoomChange(newZoom, this.lastZoomCenter);
        
        if (e.srcEvent && e.srcEvent.cancelable) {
          e.srcEvent.preventDefault();
          e.srcEvent.stopPropagation();
        }
      }
    });
  
    // Pinch end: Notify plugin and restore default behavior
    this.hammer.on('pinchend', () => {
      // Notify that pinch has ended through callback with the latest zoom level
      this.options.onPinchEnd(this.latestZoom);
      
      // Reset internal state
      this.initialZoom = undefined;
      this.lastZoomCenter = undefined;
      this.latestZoom = undefined;
    });
  }

  /**
   * Clean up event listeners and Hammer instance
   */
  public destroy(): void {
    if (this.hammer) {
      this.hammer.destroy();
    }
  }
}

// Export to make TypeScript recognize this as a module
export default PinchController; 