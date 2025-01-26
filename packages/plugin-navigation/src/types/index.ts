import { PageContainer, PluginState } from '@cloudpdf/core';
import { PdfPageObject } from '@cloudpdf/models';

export type ScrollMode = 'continuous' | 'page-by-page';
export type ZoomLevel = 'automatic' | 'fit-page' | 'fit-width' | number;
export type PageLayout = 'single' | 'dual' | 'cover';
export type PageOrientation = 0 | 90 | 180 | 270;

export interface ViewerContainer {
  element: HTMLElement;
  width: number;
  height: number;
}

export interface NavigationState extends PluginState {
  currentPage: number;
  totalPages: number;
  pages: PageContainer[];
  scrollMode: ScrollMode;
  currentZoomLevel: number;
  zoomLevel: ZoomLevel;
  pageLayout: PageLayout;
  orientation: PageOrientation;
  container?: ViewerContainer;
}

export interface NavigationOptions {
  initialPage?: number;
  defaultScrollMode?: ScrollMode;
  defaultZoomLevel?: ZoomLevel;
  defaultPageLayout?: PageLayout;
  defaultOrientation?: PageOrientation;
  container?: HTMLElement;
  minZoom?: number;
  maxZoom?: number;
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

export interface ViewportRegion {
  // The page number
  pageNumber: number;
  
  // Viewport coordinates (relative to viewport top-left)
  viewportX: number;
  viewportY: number;
  
  // Page coordinates (relative to page top-left, in PDF units)
  pageX: number;
  pageY: number;
  
  // Visible dimensions (in PDF units)
  visibleWidth: number;
  visibleHeight: number;
  
  // Percentage of page visible
  visiblePercentage: number;
}

export interface ViewportState {
  pagePositions: Map<number, {top: number, height: number}>;  
  viewportRegions: ViewportRegion[];
  zoomLevel: number;
}