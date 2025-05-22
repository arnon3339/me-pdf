import { BasePluginConfig, EventControlOptions, EventHook } from "@embedpdf/core";

export interface ViewportState {
  viewportGap: number;
  viewportMetrics: ViewportMetrics;
  isScrolling: boolean;
}

export interface ViewportPluginConfig extends BasePluginConfig {  
  viewportGap?: number;
  scrollEndDelay?: number;
}

export interface ViewportInputMetrics {
  width: number;
  height: number;
  scrollTop: number;
  scrollLeft: number;
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
}

export interface ViewportMetrics extends ViewportInputMetrics {
  relativePosition: {
    x: number;
    y: number;
  };
}

export interface ViewportScrollMetrics {
  scrollTop: number;
  scrollLeft: number;
}

export interface ScrollControlOptions {
  mode: 'debounce' | 'throttle';
  wait: number;
}

export interface ScrollToPayload {
  x: number;
  y: number;
  behavior?: ScrollBehavior;
  center?: boolean;
}

export interface ViewportCapability {
  getViewportGap: () => number;
  getMetrics: () => ViewportMetrics;
  setViewportMetrics: (metrics: ViewportInputMetrics) => void;
  setViewportScrollMetrics: (metrics: ViewportScrollMetrics) => void;
  onViewportChange: (
    handler: (metrics: ViewportMetrics) => void,
    options?: EventControlOptions
  ) => (metrics: ViewportMetrics) => void;
  scrollTo(position: ScrollToPayload): void;
  onScrollRequest: EventHook<ScrollToPayload>;
  onScrollChange: EventHook<ViewportScrollMetrics>;
  onScrollActivity: EventHook<boolean>;
  isScrolling: () => boolean;
}