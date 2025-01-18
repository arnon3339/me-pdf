import { PluginState } from '@cloudpdf/core';

export type ScrollMode = 'vertical' | 'horizontal' | 'wrapped';

export interface NavigationState extends PluginState {
  currentPage: number;
  totalPages: number;
  scrollMode: ScrollMode;
}

export interface NavigationOptions {
  initialPage?: number;
  defaultScrollMode?: ScrollMode;
}