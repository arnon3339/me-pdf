import { BasePluginConfig } from "@embedpdf/core";

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
    options?: ScrollControlOptions
  ) => (metrics: ViewportMetrics) => void;
}