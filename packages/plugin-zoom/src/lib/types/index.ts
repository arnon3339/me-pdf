import { IPlugin, PluginState } from '@embedpdf/core';

export interface IZoomPlugin extends IPlugin<ZoomState> {
  readonly name: 'zoom';
  readonly version: string;
  
  updateZoomLevel(zoomLevel: ZoomLevel): Promise<void>;
}

export interface ZoomOptions {
  defaultZoomLevel?: ZoomLevel;
  container?: HTMLElement;
  minZoom?: number;
  maxZoom?: number;
}

export type ZoomLevel = 'automatic' | 'fit-page' | 'fit-width' | number;

export interface ZoomState extends PluginState {
  currentZoomLevel: number;
  zoomLevel: ZoomLevel;
  container?: HTMLElement;
}

export interface ViewportMetrics {
  scrollTop: number;
  scrollLeft: number;
  viewportHeight: number;
  viewportWidth: number;
  scrollWidth: number;
  scrollHeight: number;
  relativePosition: {
    x: number;
    y: number;
  };
}

export interface ZoomChangeEvent {
  oldZoom: number;
  newZoom: number;
  center?: { x: number; y: number };
  metrics: ViewportMetrics;
} 