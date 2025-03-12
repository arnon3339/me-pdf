import { BasePluginConfig } from "@embedpdf/core";
import { ViewportMetrics } from "@embedpdf/plugin-viewport";

export interface ZoomPluginConfig extends BasePluginConfig {
  defaultZoomLevel: ZoomLevel;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
}

export interface ZoomCapability {
  onZoom(handler: (zoomEvent: ZoomChangeEvent) => void): void;
  updateZoomLevel(zoomLevel: ZoomLevel): Promise<void>;
  getState(): ZoomState;
  onStateChange(handler: (state: ZoomState) => void): void;
}

export type ZoomLevel = 'automatic' | 'fit-page' | 'fit-width' | number;

export interface ZoomChangeEvent {
  oldZoom: number;
  oldMetrics: ViewportMetrics;
  newZoom: number;
  newMetrics: ViewportMetrics;
  center?: { x: number; y: number };
} 

export interface ZoomState {
  zoomLevel: ZoomLevel;
  currentZoomLevel: number;
}