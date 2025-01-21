import { PluginState } from '@cloudpdf/core';
import { PdfPageObject } from '@cloudpdf/models';

export type ScrollMode = 'continuous' | 'page-by-page';
export type ZoomMode = 'automatic' | 'fit-page' | 'fit-width' | 'custom';
export type PageLayout = 'single' | 'dual' | 'cover';
export type PageOrientation = 0 | 90 | 180 | 270;

export interface ViewerContainer {
  element: HTMLElement;
  width: number;
  height: number;
}

export interface PageElement {
  element: HTMLElement;
  page: PdfPageObject;
}

export interface NavigationState extends PluginState {
  currentPage: number;
  totalPages: number;
  pages: PageElement[];
  scrollMode: ScrollMode;
  zoomMode: ZoomMode;
  zoomLevel: number;
  pageLayout: PageLayout;
  orientation: PageOrientation;
  container?: ViewerContainer;
}

export interface NavigationOptions {
  initialPage?: number;
  defaultScrollMode?: ScrollMode;
  defaultZoomMode?: ZoomMode;
  defaultZoomLevel?: number;
  defaultPageLayout?: PageLayout;
  defaultOrientation?: PageOrientation;
  container?: HTMLElement;
}