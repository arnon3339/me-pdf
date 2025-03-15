import { BasePluginConfig } from "@embedpdf/core";
import { EventControlOptions } from "./utils/event-control";

export interface ViewportPluginConfig extends BasePluginConfig {
  container?: HTMLElement; 
  defaultWidth?: number;
  defaultHeight?: number;    
  viewportGap?: number;
}

export interface ViewportMetrics {
  width: number;
  height: number;
  scrollTop: number;
  scrollLeft: number;
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
  relativePosition: {
    x: number;
    y: number;
  };
}

export interface ScrollControlOptions {
  mode: 'debounce' | 'throttle';
  wait: number;
}

export interface WrapperDivOptions {
  id: string;
  className?: string;
  styles?: Partial<CSSStyleDeclaration>;
  position?: number; // Optional position in the wrapper stack (0 is closest to container)
}

export interface ViewportCapability {
  getContainer: () => HTMLElement;
  getMetrics: () => ViewportMetrics;
  setContainer: (container: HTMLElement) => void;
  getViewportGap: () => number;
  // Inner div methods
  getInnerDiv: () => HTMLElement;
  // Wrapper div methods
  addWrapperDiv: (options: WrapperDivOptions) => HTMLElement;
  getWrapperDiv: (id: string) => HTMLElement | null;
  removeWrapperDiv: (id: string) => boolean;
  // Event handlers
  onViewportChange: (
    handler: (metrics: ViewportMetrics) => void,
    options?: EventControlOptions
  ) => (metrics: ViewportMetrics) => void;
  onResize: (handler: (metrics: ViewportMetrics) => void, options?: EventControlOptions) => (metrics: ViewportMetrics) => void;
  onContainerChange: (handler: (container: HTMLElement) => void) => void;
}