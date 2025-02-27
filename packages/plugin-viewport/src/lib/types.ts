import { BasePluginConfig } from "@embedpdf/core";
import { EventControlOptions } from "./utils/event-control";

export interface ViewportPluginConfig extends BasePluginConfig {
  container?: HTMLElement; 
  defaultWidth?: number;
  defaultHeight?: number;    
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

export interface ViewportCapability {
  getContainer: () => HTMLElement;
  getMetrics: () => ViewportMetrics;
  setContainer: (container: HTMLElement) => void;
  onViewportChange: (
    handler: (metrics: ViewportMetrics) => void,
    options?: EventControlOptions
  ) => (metrics: ViewportMetrics) => void;
  onResize: (handler: (metrics: ViewportMetrics) => void, options?: EventControlOptions) => (metrics: ViewportMetrics) => void;
  onContainerChange: (handler: (container: HTMLElement) => void) => void;
}